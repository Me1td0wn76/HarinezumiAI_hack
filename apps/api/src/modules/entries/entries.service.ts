import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EventEntryDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { EventsService } from '../events/events.service.js';
import { toEventEntryDto } from '../events/events.mapper.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EntriesRepository, type EntryFields } from './entries.repository.js';
import { SubmitEntryDto } from './dto/submit-entry.dto.js';

/**
 * LT会への参加表明（登壇 / 聴講）。候補日への回答（ResponsesService）とは独立している。
 * 登壇の発表タイトルは公開、発表内容の説明と発表時間は主催者と本人にだけ見せる（events.mapper の toEventEntryDto）
 */
@Injectable()
export class EntriesService {
  constructor(
    private readonly entries: EntriesRepository,
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * 参加表明を作成・更新する。聴講から登壇に変えたときも「新しく登壇を表明した」として主催者に通知する
   * （切り替えを繰り返したときの重複とブロックの除外は NotificationsRepository.createSpeakerEntered が行う）
   */
  async submit(eventId: string, user: User, dto: SubmitEntryDto): Promise<EventEntryDto> {
    const fields = normalizeEntry(dto);
    // 状態・主催者の確認と、既存の表明の役割の取得は互いに依存しないので同時に行う（詳細グラフは読まない）
    const [event, previousRole] = await Promise.all([
      this.events.findVisibleAccessInfoOrThrow(eventId, user),
      this.entries.findRole(eventId, user.id),
    ]);
    if (event.status === 'CLOSED') {
      throw new BadRequestException('終了したLT会には参加表明できません');
    }
    // 主催者は登壇者・参加者の一覧に載せない（主催者として表示されている。docs/open-questions.md F-9）
    if (event.organizerId === user.id) {
      throw new BadRequestException('主催者は参加表明できません');
    }
    const entry = await this.entries.upsert(eventId, user.id, fields);

    if (fields.role === 'SPEAKER' && previousRole !== 'SPEAKER') {
      this.notifications.speakerEntered(event, user, fields.talkTitle ?? '');
    }
    return toEventEntryDto(entry, true);
  }

  /** 自分の参加表明を取り消す。終了したLT会でも取り消せる（参加履歴から外したい場合のため） */
  async remove(eventId: string, user: User): Promise<void> {
    await this.events.findVisibleAccessInfoOrThrow(eventId, user);
    const deleted = await this.entries.delete(eventId, user.id);
    if (deleted === 0) throw new NotFoundException('参加表明が見つかりません');
  }
}

/** 登壇なら発表タイトルを必須にし、聴講なら発表に関する項目を捨てる。前後の空白は落とし、空文字は null にする */
export function normalizeEntry(dto: SubmitEntryDto): EntryFields {
  if (dto.role === 'AUDIENCE') {
    return { role: 'AUDIENCE', talkTitle: null, talkDetail: null, durationMinutes: null };
  }
  const talkTitle = dto.talkTitle?.trim();
  if (!talkTitle) throw new BadRequestException('登壇する場合は発表タイトルを入力してください');
  return {
    role: 'SPEAKER',
    talkTitle,
    talkDetail: dto.talkDetail?.trim() || null,
    durationMinutes: dto.durationMinutes ?? null,
  };
}
