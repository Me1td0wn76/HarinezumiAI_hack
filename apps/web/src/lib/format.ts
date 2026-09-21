/** 国内向けサービスなので表示は日本時間に固定する。海外対応時はユーザー設定に置き換える */
const TIME_ZONE = 'Asia/Tokyo';

const dateTime = new Intl.DateTimeFormat('ja-JP', {
  timeZone: TIME_ZONE,
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const timeOnly = new Intl.DateTimeFormat('ja-JP', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** 「10/5(月) 18:00〜19:00」のように範囲で表示する */
export function formatDateRange(startIso: string, endIso: string | null): string {
  const start = formatDateTime(startIso);
  return endIso ? `${start}〜${timeOnly.format(new Date(endIso))}` : start;
}

/**
 * <input type="datetime-local"> の値（ブラウザのローカル時刻、"2026-10-05T18:00"）を ISO 文字列にする。
 * サーバーのタイムゾーンに依存しないよう、ブラウザから送られた getTimezoneOffset() を使う。
 */
export function localInputToIso(value: string, tzOffsetMinutes: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) + tzOffsetMinutes * 60_000;
  return new Date(utc).toISOString();
}
