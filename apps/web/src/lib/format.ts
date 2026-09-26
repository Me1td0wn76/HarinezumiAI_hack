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

const dateOnly = new Intl.DateTimeFormat('ja-JP', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** 「2026年9月25日」。登録日など時刻が要らない表示に使う */
export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

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

const tokyoParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * ISO 文字列を日本時間の壁時計の時刻（タイムゾーンなし、"2026-10-05T18:00"）にする。
 * カレンダー（FullCalendar）を timeZone: 'UTC' で動かし、ブラウザのタイムゾーンに関係なく日本時間で並べるために使う
 */
export function toTokyoWallClock(iso: string): string {
  const p = Object.fromEntries(tokyoParts.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// ---------- 月（"2026-10" 形式）: カレンダーの月表示に使う ----------

/** 日本時間の今月（"2026-10"） */
export function currentTokyoMonth(): string {
  return toTokyoWallClock(new Date().toISOString()).slice(0, 7);
}

/** 月を delta だけずらす（"2026-12", 1 → "2027-01"） */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "2026-10" → "2026年10月" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${y}年${m}月`;
}

/**
 * その月の 1 日 0:00（TIME_ZONE の壁時計）の瞬間。オフセットを文字列に書かず、TIME_ZONE から求める
 */
export function tokyoMonthStart(month: string): Date {
  const [y, m] = month.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, 1);
  // UTC の 0:00 を TIME_ZONE の壁時計で見たときのずれ（日本時間なら +9 時間）だけ戻す
  const offset = Date.parse(`${toTokyoWallClock(new Date(utcMidnight).toISOString())}:00Z`) - utcMidnight;
  return new Date(utcMidnight - offset);
}
