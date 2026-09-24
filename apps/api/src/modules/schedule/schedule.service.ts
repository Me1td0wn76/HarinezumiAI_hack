import { Injectable } from '@nestjs/common';
import type { ScheduleItemDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { ScheduleRepository } from './schedule.repository.js';

@Injectable()
export class ScheduleService {
  constructor(private readonly schedule: ScheduleRepository) {}

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
        });
      }
    }
    return items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
}
