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
import { EventsRepository, decodeEventCursor, type EventDetail, type NewCandidateDate } from './events.repository.js';
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
  ) {}

  /** @param viewer ログインしていれば、ブロックしている相手のLT会を除く */
  async list(query: ListEventsQueryDto, viewer: User | null): Promise<PageDto<EventSummaryDto>> {
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
        organizationSlug: query.organization?.trim().toLowerCase() || undefined,
      },
      query.limit,
      cursor,
      blockedIds,
    );
    return { items: page.items.map(toEventSummaryDto), nextCursor: page.nextCursor };
  }

  /** 団体ページのLT会一覧。存在しない団体は 404 */
  async listByOrganization(
    rawSlug: string,
    query: ListEventsQueryDto,
    viewer: User | null,
  ): Promise<PageDto<EventSummaryDto>> {
    const slug = rawSlug.toLowerCase();
    const org = ORGANIZATION_SLUG_PATTERN.test(slug) ? await this.organizations.findBySlug(slug) : null;
    if (!org) throw new NotFoundException('団体が見つかりません');
    // クエリの DTO はリクエストごとに作られるので、そのまま書き換えてよい
    query.organization = org.slug;
    return this.list(query, viewer);
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
    return toEventDetailDto(event, { userId: organizer.id });
  }

  async getDetail(id: string, viewer: User | null): Promise<EventDetailDto> {
    const event = await this.findVisibleOrThrow(id, viewer);
    return toEventDetailDto(event, { userId: viewer?.id });
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
    return toEventDetailDto(updated, { userId: user.id });
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
    return toEventDetailDto(confirmed, { userId: user.id });
  }

  /** 主催者がLT会を終了する（開催済み・中止など） */
  async close(id: string, user: User): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (event.status === 'CLOSED') {
      throw new BadRequestException('すでに終了しています');
    }
    const closed = await this.events.update(id, { status: 'CLOSED' });
    return toEventDetailDto(closed, { userId: user.id });
  }

  async findOrThrow(id: string): Promise<EventDetail> {
    const event = await this.events.findDetailById(id);
    if (!event) throw new NotFoundException('LT会が見つかりません');
    return event;
  }

  /** 運営が非表示にしたLT会は、主催者と運営以外には存在しないものとして扱う */
  async findVisibleOrThrow(id: string, viewer: User | null): Promise<EventDetail> {
    const event = await this.findOrThrow(id);
    if (event.hiddenAt && viewer?.id !== event.organizerId && viewer?.role !== 'ADMIN') {
      throw new NotFoundException('LT会が見つかりません');
    }
    return event;
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
