import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ORGANIZATION_SLUG_PATTERN,
  type EventDetailDto,
  type EventSummaryDto,
  type MyEventsDto,
  type PageDto,
  type TagCountDto,
} from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { ENTRY_LIMIT, EntriesRepository } from '../entries/entries.repository.js';
import {
  EventsRepository,
  decodeEventCursor,
  type EventAccessInfo,
  type EventDetail,
  type NewCandidateDate,
} from './events.repository.js';
import { toEventDetailDto, toEventSummaryDto } from './events.mapper.js';
import { normalizeTags } from './tags.js';
import { normalizeFormatFields } from './format.js';
import { ListEventsQueryDto } from './dto/list-events-query.dto.js';
import { CandidateDateDto } from './dto/candidate-date.dto.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { AddDatesDto } from './dto/add-dates.dto.js';
import { ConfirmEventDto } from './dto/confirm-event.dto.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly events: EventsRepository,
    private readonly notifications: NotificationsService,
    private readonly blocks: BlocksRepository,
    private readonly organizations: OrganizationsRepository,
    private readonly entries: EntriesRepository,
  ) {}

  /**
   * @param viewer ログインしていれば、ブロックしている相手のLT会を除く
   * `organization`（slug）は団体の id に引き直してから絞り込む（存在しない団体なら該当なし）
   */
  async list(query: ListEventsQueryDto, viewer: User | null): Promise<PageDto<EventSummaryDto>> {
    let organizationId: string | undefined;
    if (query.organization) {
      const org = await this.findOrganizationBySlug(query.organization);
      if (!org) return { items: [], nextCursor: null };
      organizationId = org.id;
    }
    return this.listPage(query, viewer, organizationId);
  }

  /** 団体ページのLT会一覧。存在しない団体は 404 */
  async listByOrganization(
    rawSlug: string,
    query: ListEventsQueryDto,
    viewer: User | null,
  ): Promise<PageDto<EventSummaryDto>> {
    const org = await this.findOrganizationBySlug(rawSlug);
    if (!org) throw new NotFoundException('団体が見つかりません');
    return this.listPage(query, viewer, org.id);
  }

  /** 形式に合わない slug は存在し得ないので DB に問い合わせない */
  private async findOrganizationBySlug(rawSlug: string) {
    const slug = rawSlug.trim().toLowerCase();
    return ORGANIZATION_SLUG_PATTERN.test(slug) ? this.organizations.findBySlug(slug) : null;
  }

  private async listPage(
    query: ListEventsQueryDto,
    viewer: User | null,
    organizationId: string | undefined,
  ): Promise<PageDto<EventSummaryDto>> {
    const cursor = query.cursor ? decodeEventCursor(query.cursor) : undefined;
    if (cursor === null) throw new BadRequestException('cursor が不正です');
    const blockedIds = viewer ? await this.blocks.findBlockedIds(viewer.id) : [];
    const page = await this.events.findPage(
      {
        tag: query.tag?.trim().toLowerCase() || undefined,
        q: query.q?.trim() || undefined,
        status: query.status,
        format: query.format,
        organizerId: query.organizerId,
        organizationId,
      },
      query.limit,
      cursor,
      blockedIds,
    );
    return { items: page.items.map(toEventSummaryDto), nextCursor: page.nextCursor };
  }

  topTags(limit: number): Promise<TagCountDto[]> {
    return this.events.findTopTags(limit);
  }

  /** 自分の主催・参加履歴 */
  async history(user: User): Promise<MyEventsDto> {
    const [organized, participated] = await Promise.all([
      this.events.findManyByOrganizer(user.id),
      this.events.findManyRespondedBy(user.id),
    ]);
    return { organized: organized.map(toEventSummaryDto), participated: participated.map(toEventSummaryDto) };
  }

  async create(organizer: User, dto: CreateEventDto): Promise<EventDetailDto> {
    if (dto.organizationId) await this.assertMemberOf(dto.organizationId, organizer);
    const event = await this.events.create({
      title: dto.title,
      description: dto.description,
      organizerId: organizer.id,
      candidateDates: parseCandidateDates(dto.candidateDates),
      webhookUrl: dto.webhookUrl || null,
      tags: normalizeTags(dto.tags),
      formatFields: normalizeFormatFields(dto.format ?? 'ONLINE', dto.venue, dto.meetingUrl),
      organizationId: dto.organizationId || null,
    });
    this.notifications.eventCreated(event);
    return this.toDetail(event, { user: organizer });
  }

  async getDetail(id: string, viewer: User | null): Promise<EventDetailDto> {
    const event = await this.findVisibleOrThrow(id, viewer);
    return this.toDetail(event, { user: viewer });
  }

  /**
   * LT会の詳細を EventDetailDto にする。詳細を返す経路（取得・編集・決定・終了・共有URL・回答）はすべてここを通す。
   * 参加表明の一覧は閲覧者によって変わる:
   * - 主催者: 全員（ブロックした相手も、上限なしで）。登壇者を把握するのが主催者向けの中心的な要件のため
   * - それ以外のログインユーザー: ブロックした相手を除いて最大 ENTRY_LIMIT 件（コメント欄と同じ扱い）
   * - ゲスト・未ログイン: 最大 ENTRY_LIMIT 件
   */
  async toDetail(
    event: EventDetail,
    viewer: { user?: User | null; guestKey?: string | null },
  ): Promise<EventDetailDto> {
    const user = viewer.user ?? null;
    const isOrganizer = user?.id === event.organizerId;
    const excludeUserIds = user && !isOrganizer ? await this.blocks.findBlockedIds(user.id) : [];
    const entries = await this.entries.findForEvent(event.id, {
      excludeUserIds,
      viewerId: user?.id,
      limit: isOrganizer ? null : ENTRY_LIMIT,
    });
    return toEventDetailDto(event, { userId: user?.id, guestKey: viewer.guestKey }, entries);
  }

  async update(id: string, user: User, dto: UpdateEventDto): Promise<EventDetailDto> {
    const current = await this.findOwnedOrThrow(id, user);
    // 形式・会場・URL は「指定された値 or 現在値」で正規化し直す（形式が変わると不要な項目が落ちる）
    const formatFields = normalizeFormatFields(
      dto.format ?? current.format,
      dto.venue !== undefined ? dto.venue : current.venue,
      dto.meetingUrl !== undefined ? dto.meetingUrl : current.meetingUrl,
    );
    // 付け替えるときだけ所属を確認する（団体を抜けた後でも、今の紐付けのまま他の項目は編集できる）
    const nextOrganizationId = dto.organizationId === undefined ? undefined : dto.organizationId || null;
    if (nextOrganizationId && nextOrganizationId !== current.organizationId) {
      await this.assertMemberOf(nextOrganizationId, user);
    }
    const linkedToNewOrganization = !!nextOrganizationId && nextOrganizationId !== current.organizationId;
    const updated = await this.events.update(
      id,
      {
        title: dto.title,
        description: dto.description,
        ...formatFields,
        // undefined は変更なし、null / 空文字は解除
        webhookUrl: dto.webhookUrl === undefined ? undefined : dto.webhookUrl || null,
        organization:
          nextOrganizationId === undefined
            ? undefined
            : nextOrganizationId
              ? { connect: { id: nextOrganizationId } }
              : { disconnect: true },
      },
      dto.tags !== undefined ? normalizeTags(dto.tags) : undefined,
    );
    // 作成時の通知は新しい団体の Discord に届いていないので、紐付いたことを知らせる
    if (linkedToNewOrganization) this.notifications.eventLinkedToOrganization(updated);
    return this.toDetail(updated, { user });
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOwnedOrThrow(id, user);
    await this.events.delete(id);
  }

  async addDates(id: string, user: User, dto: AddDatesDto): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (event.status !== 'OPEN') {
      throw new BadRequestException('日程調整中のLT会にのみ候補日を追加できます');
    }
    await this.events.addDates(id, parseCandidateDates(dto.candidateDates));
    return this.getDetail(id, user);
  }

  async removeDate(id: string, dateId: string, user: User): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (!event.candidateDates.some((d) => d.id === dateId)) {
      throw new NotFoundException('候補日が見つかりません');
    }
    if (event.confirmedDateId === dateId) {
      throw new BadRequestException('決定済みの開催日は削除できません');
    }
    await this.events.deleteDate(dateId);
    return this.getDetail(id, user);
  }

  /** 主催者が開催日を決定する */
  async confirm(id: string, user: User, dto: ConfirmEventDto): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (event.status === 'CLOSED') {
      throw new BadRequestException('終了したLT会の開催日は決定できません');
    }
    if (!event.candidateDates.some((d) => d.id === dto.eventDateId)) {
      throw new NotFoundException('候補日が見つかりません');
    }
    // 同じ日で決定し直したとき（ボタンの押し直しなど）は、回答者に同じ通知を重ねて送らない
    const alreadyConfirmed = event.status === 'CONFIRMED' && event.confirmedDateId === dto.eventDateId;
    const confirmed = await this.events.confirm(id, dto.eventDateId);
    if (!alreadyConfirmed) this.notifications.eventConfirmed(confirmed);
    return this.toDetail(confirmed, { user });
  }

  /** 主催者がLT会を終了する（開催済み・中止など） */
  async close(id: string, user: User): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (event.status === 'CLOSED') {
      throw new BadRequestException('すでに終了しています');
    }
    const closed = await this.events.update(id, { status: 'CLOSED' });
    return this.toDetail(closed, { user });
  }

  async findOrThrow(id: string): Promise<EventDetail> {
    const event = await this.events.findDetailById(id);
    if (!event) throw new NotFoundException('LT会が見つかりません');
    return event;
  }

  /** 運営が非表示にしたLT会は、主催者と運営以外には存在しないものとして扱う */
  async findVisibleOrThrow(id: string, viewer: User | null): Promise<EventDetail> {
    return assertVisible(await this.findOrThrow(id), viewer);
  }

  /**
   * findVisibleOrThrow の軽量版。詳細グラフ（候補日・回答など）を読まず、状態と主催者だけを返す。
   * 参加表明のように、閲覧可否と状態だけを見る操作で使う
   */
  async findVisibleAccessInfoOrThrow(id: string, viewer: User | null): Promise<EventAccessInfo> {
    const event = await this.events.findAccessInfoById(id);
    if (!event) throw new NotFoundException('LT会が見つかりません');
    return assertVisible(event, viewer);
  }

  /** 団体名義でLT会を立てられるのはその団体のメンバーだけ（団体の Discord に通知が流れるため） */
  private async assertMemberOf(organizationId: string, user: User): Promise<void> {
    if (!(await this.organizations.findRole(organizationId, user.id))) {
      throw new ForbiddenException('所属している団体のみ選べます');
    }
  }

  private async findOwnedOrThrow(id: string, user: User): Promise<EventDetail> {
    const event = await this.findOrThrow(id);
    if (event.organizerId !== user.id) {
      throw new ForbiddenException('主催者のみ操作できます');
    }
    return event;
  }
}

/** 非表示のLT会は主催者と運営以外には 404（findVisibleOrThrow / findVisibleAccessInfoOrThrow で同じ判定を使う） */
function assertVisible<T extends { hiddenAt: Date | null; organizerId: string }>(event: T, viewer: User | null): T {
  if (event.hiddenAt && viewer?.id !== event.organizerId && viewer?.role !== 'ADMIN') {
    throw new NotFoundException('LT会が見つかりません');
  }
  return event;
}

function parseCandidateDates(dates: CandidateDateDto[]): NewCandidateDate[] {
  return dates.map((d) => {
    const startsAt = new Date(d.startsAt);
    const endsAt = d.endsAt ? new Date(d.endsAt) : null;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('終了日時は開始日時より後にしてください');
    }
    return { startsAt, endsAt };
  });
}
