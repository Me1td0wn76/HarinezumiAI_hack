import type {
  DateTallyDto,
  EventDateDto,
  EventDetailDto,
  EventSummaryDto,
  ResponderRowDto,
} from '@lt/shared';
import type { EventDate } from '../../generated/prisma/client.js';
import { toPublicUserDto } from '../users/users.mapper.js';
import type { EventDetail, EventSummary } from './events.repository.js';

export function toEventDateDto(date: EventDate): EventDateDto {
  return {
    id: date.id,
    startsAt: date.startsAt.toISOString(),
    endsAt: date.endsAt?.toISOString() ?? null,
  };
}

/** ログインユーザーとゲストを同じ表で扱うためのキー */
function responderKeyOf(r: {
  userId: string | null;
  guestKey: string | null;
}): string {
  return r.userId ?? `guest:${r.guestKey ?? ''}`;
}

export function toEventSummaryDto(event: EventSummary): EventSummaryDto {
  const responders = new Set<string>();
  for (const date of event.candidateDates) {
    for (const r of date.responses) responders.add(responderKeyOf(r));
  }
  return {
    id: event.id,
    title: event.title,
    status: event.status,
    organizer: toPublicUserDto(event.organizer),
    confirmedDate: event.confirmedDate
      ? toEventDateDto(event.confirmedDate)
      : null,
    candidateDateCount: event.candidateDates.length,
    responderCount: responders.size,
    createdAt: event.createdAt.toISOString(),
  };
}

/**
 * @param viewerId 閲覧しているユーザー。主催者本人のときだけ shareToken を含める
 */
export function toEventDetailDto(
  event: EventDetail,
  viewerId: string | null,
): EventDetailDto {
  const tallies: DateTallyDto[] = [];
  const rows = new Map<string, ResponderRowDto>();

  for (const date of event.candidateDates) {
    const tally: DateTallyDto = {
      eventDate: toEventDateDto(date),
      yes: 0,
      maybe: 0,
      no: 0,
    };
    for (const r of date.responses) {
      if (r.availability === 'YES') tally.yes++;
      else if (r.availability === 'MAYBE') tally.maybe++;
      else tally.no++;

      const key = responderKeyOf(r);
      let row = rows.get(key);
      if (!row) {
        row = {
          responderKey: key,
          displayName: r.user?.displayName ?? r.guestName ?? '匿名',
          isGuest: r.userId === null,
          answers: {},
        };
        rows.set(key, row);
      }
      row.answers[date.id] = {
        availability: r.availability,
        comment: r.comment,
      };
    }
    tallies.push(tally);
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    status: event.status,
    organizer: toPublicUserDto(event.organizer),
    confirmedDate: event.confirmedDate
      ? toEventDateDto(event.confirmedDate)
      : null,
    candidateDates: event.candidateDates.map(toEventDateDto),
    tallies,
    responders: [...rows.values()],
    shareToken: viewerId === event.organizerId ? event.shareToken : null,
    createdAt: event.createdAt.toISOString(),
  };
}
