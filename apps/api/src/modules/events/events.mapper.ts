import { createHash } from 'node:crypto';
import type {
  DateTallyDto,
  EventDateDto,
  EventDetailDto,
  EventEntryDto,
  EventSummaryDto,
  ResponderRowDto,
} from '@lt/shared';
import type { EventDate } from '../../generated/prisma/client.js';
import { toPublicUserDto } from '../users/users.mapper.js';
import type { EventDetail, EventSummary } from './events.repository.js';

type EventEntryWithUser = EventDetail['entries'][number];

export function toEventDateDto(date: EventDate): EventDateDto {
  return {
    id: date.id,
    startsAt: date.startsAt.toISOString(),
    endsAt: date.endsAt?.toISOString() ?? null,
  };
}

/**
 * ログインユーザーとゲストを同じ表で扱うためのキー。
 * guestKey はゲストの合言葉（知っていれば回答の上書きや配信URL の取得ができる）なので、公開する一覧にはハッシュだけを載せる。
 * web 側（apps/web/src/lib/guest-key.ts）も同じ計算で自分の行を見つける
 */
function responderKeyOf(r: { userId: string | null; guestKey: string | null }): string {
  if (r.userId) return r.userId;
  return `guest:${createHash('sha256')
    .update(r.guestKey ?? '')
    .digest('hex')}`;
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
    confirmedDate: event.confirmedDate ? toEventDateDto(event.confirmedDate) : null,
    candidateDateCount: event.candidateDates.length,
    responderCount: responders.size,
    tags: event.tags.map((t) => t.tag),
    format: event.format,
    createdAt: event.createdAt.toISOString(),
  };
}

/** 閲覧者。ログインユーザーは userId、共有URL のゲストは guestKey で識別する */
export interface Viewer {
  userId?: string | null;
  guestKey?: string | null;
  /** 参加表明の一覧から除くユーザー（閲覧者がブロックした相手） */
  excludeEntryUserIds?: string[];
}

/**
 * @param viewer 閲覧者。主催者本人のときだけ shareToken を含める。
 *   配信URL は主催者にはいつでも、回答者には開催日決定後にだけ返す
 */
export function toEventDetailDto(event: EventDetail, viewer: Viewer): EventDetailDto {
  const viewerId = viewer.userId ?? null;
  const tallies: DateTallyDto[] = [];
  const rows = new Map<string, ResponderRowDto>();
  let viewerResponded = false;

  for (const date of event.candidateDates) {
    const tally: DateTallyDto = { eventDate: toEventDateDto(date), yes: 0, maybe: 0, no: 0 };
    for (const r of date.responses) {
      if (r.availability === 'YES') tally.yes++;
      else if (r.availability === 'MAYBE') tally.maybe++;
      else tally.no++;

      if ((viewerId && r.userId === viewerId) || (viewer.guestKey && r.guestKey === viewer.guestKey)) {
        viewerResponded = true;
      }
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
      row.answers[date.id] = { availability: r.availability, comment: r.comment };
    }
    tallies.push(tally);
  }

  const isOrganizer = viewerId === event.organizerId;
  const excluded = new Set(viewer.excludeEntryUserIds);
  const entries = event.entries
    .filter((e) => !excluded.has(e.userId))
    // 登壇者を先に。同じ役割の中では表明の古い順（取得時の並び）を保つ
    .sort((a, b) => Number(a.role === 'AUDIENCE') - Number(b.role === 'AUDIENCE'))
    .map((e) => toEventEntryDto(e, isOrganizer || e.userId === viewerId));
  const myEntry = viewerId ? (entries.find((e) => e.user.id === viewerId) ?? null) : null;
  // 参加表明した人も「関わっている人」なので、開催日決定後は配信URL を見せる
  const canSeeMeetingUrl = isOrganizer || (event.status === 'CONFIRMED' && (viewerResponded || myEntry !== null));

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    status: event.status,
    organizer: toPublicUserDto(event.organizer),
    confirmedDate: event.confirmedDate ? toEventDateDto(event.confirmedDate) : null,
    candidateDates: event.candidateDates.map(toEventDateDto),
    tallies,
    responders: [...rows.values()],
    shareToken: isOrganizer ? event.shareToken : null,
    hidden: event.hiddenAt !== null,
    webhookUrl: isOrganizer ? event.webhookUrl : null,
    tags: event.tags.map((t) => t.tag),
    format: event.format,
    venue: event.venue,
    meetingUrl: canSeeMeetingUrl ? event.meetingUrl : null,
    hasMeetingUrl: event.meetingUrl !== null,
    entries,
    myEntry,
    createdAt: event.createdAt.toISOString(),
  };
}

/**
 * @param showPrivate 発表内容の説明と発表時間を含めるか（主催者と本人のみ）。発表タイトルは公開する
 */
export function toEventEntryDto(entry: EventEntryWithUser, showPrivate: boolean): EventEntryDto {
  return {
    user: toPublicUserDto(entry.user),
    role: entry.role,
    talkTitle: entry.talkTitle,
    talkDetail: showPrivate ? entry.talkDetail : null,
    durationMinutes: showPrivate ? entry.durationMinutes : null,
    createdAt: entry.createdAt.toISOString(),
  };
}
