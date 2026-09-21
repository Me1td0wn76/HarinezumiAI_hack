import type { ResponseInput } from '@lt/shared';
import { AVAILABILITY } from '@lt/shared';
import { localInputToIso } from '@/lib/format';

/** FormData から文字列を取り出す（無ければ空文字） */
export function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** CandidateDatesField が送る startsAt[] / endsAt[] / tzOffset を API の形にする */
export function parseCandidateDates(formData: FormData): { startsAt: string; endsAt: string | null }[] {
  const tzOffset = Number(formData.get('tzOffset') ?? 0);
  const starts = formData.getAll('startsAt').map(String);
  const ends = formData.getAll('endsAt').map(String);
  const dates: { startsAt: string; endsAt: string | null }[] = [];
  starts.forEach((s, i) => {
    const startsAt = localInputToIso(s, tzOffset);
    if (!startsAt) return;
    dates.push({ startsAt, endsAt: ends[i] ? localInputToIso(ends[i], tzOffset) : null });
  });
  return dates;
}

/**
 * ResponseForm が送る availability:<dateId> / comment:<dateId> を API の形にする。
 * 未選択の候補日は送らない。
 */
export function parseResponses(formData: FormData): ResponseInput[] {
  const responses: ResponseInput[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('availability:') || typeof value !== 'string') continue;
    if (!(AVAILABILITY as readonly string[]).includes(value)) continue;
    const eventDateId = key.slice('availability:'.length);
    const comment = str(formData, `comment:${eventDateId}`);
    responses.push({ eventDateId, availability: value as ResponseInput['availability'], comment: comment || null });
  }
  return responses;
}
