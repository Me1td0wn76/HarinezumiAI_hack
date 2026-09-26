import { BadRequestException, Injectable } from '@nestjs/common';
import { PUBLIC_SCHEDULE_MAX_DAYS, type PublicScheduleItemDto, type ScheduleItemDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { toPublicUserDto } from '../users/users.mapper.js';
import { ScheduleRepository } from './schedule.repository.js';
import { PublicScheduleQueryDto } from './dto/public-schedule-query.dto.js';

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ScheduleService {
  constructor(
    private readonly schedule: ScheduleRepository,
    private readonly blocks: BlocksRepository,
  ) {}

  /**
   * 開催日が決まったLT会は確定日だけ、日程調整中のLT会は候補日をすべて返す。
   * 開始日時の昇順
   */
  async forUser(user: User): Promise<ScheduleItemDto[]> {
    const events = await this.schedule.findForUser(user.id);
    const items: ScheduleItemDto[] = [];
    for (const event of events) {
      const role = event.organizerId === user.id ? 'ORGANIZER' : 'RESPONDENT';
      const dates = event.confirmedDateId
        ? event.candidateDates.filter((d) => d.id === event.confirmedDateId)
        : event.candidateDates;
      for (const date of dates) {
        items.push({
          eventId: event.id,
          title: event.title,
          status: event.status,
          role,
          eventDateId: date.id,
          startsAt: date.startsAt.toISOString(),
          endsAt: date.endsAt?.toISOString() ?? null,
          confirmed: date.id === event.confirmedDateId,
          myAvailability: date.responses[0]?.availability ?? null,
          myEntryRole: event.entries[0]?.role ?? null,
        });
      }
    }
    return items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  /**
   * みんなのカレンダー。[from, to) の公開中のLT会の開催日 / 候補日を開始日時の昇順で返す。
   * ログインしていればブロックした相手のLT会を除く
   */
  async publicBetween(query: PublicScheduleQueryDto, viewer: User | null): Promise<PublicScheduleItemDto[]> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from) throw new BadRequestException('to は from より後にしてください');
    if (to.getTime() - from.getTime() > PUBLIC_SCHEDULE_MAX_DAYS * DAY) {
      throw new BadRequestException(`期間は ${PUBLIC_SCHEDULE_MAX_DAYS} 日以内にしてください`);
    }
    const blockedIds = viewer ? await this.blocks.findBlockedIds(viewer.id) : [];
    const events = await this.schedule.findPublicBetween(from, to, blockedIds);

    const items: PublicScheduleItemDto[] = [];
    for (const event of events) {
      const dates = event.confirmedDateId
        ? event.candidateDates.filter((d) => d.id === event.confirmedDateId)
        : event.candidateDates;
      for (const date of dates) {
        items.push({
          eventId: event.id,
          title: event.title,
          status: event.status,
          format: event.format,
          organizer: toPublicUserDto(event.organizer),
          eventDateId: date.id,
          startsAt: date.startsAt.toISOString(),
          endsAt: date.endsAt?.toISOString() ?? null,
          confirmed: date.id === event.confirmedDateId,
        });
      }
    }
    return items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
}
