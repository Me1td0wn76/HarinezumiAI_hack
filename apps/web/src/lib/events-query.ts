import {
  EVENT_FORMAT,
  EVENT_SEARCH_MAX_LENGTH,
  EVENT_STATUS,
  ORGANIZATION_SLUG_PATTERN,
  TAG_MAX_LENGTH,
  type EventFormat,
  type EventListQuery,
  type EventStatus,
  type EventSummaryDto,
  type PageDto,
} from "@lt/shared";

/** 取得せずに「該当なし」を返すときの空ページ */
export const EMPTY_EVENT_PAGE: PageDto<EventSummaryDto> = { items: [], nextCursor: null };

/**
 * URL の searchParams から一覧クエリを組み立てる。不正な値は無視する。
 * 誰でも URL を書き換えられるので、長すぎる q は API の上限（400 になる）に合わせて切り詰める。
 */
export function parseEventListQuery(params: Record<string, string | string[] | undefined>): EventListQuery {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const status = one("status");
  const format = one("format");
  const organization = one("organization")?.toLowerCase();
  return {
    q: one("q")?.slice(0, EVENT_SEARCH_MAX_LENGTH).trim() || undefined,
    tag: one("tag"),
    status: status && (EVENT_STATUS as readonly string[]).includes(status) ? (status as EventStatus) : undefined,
    format: format && (EVENT_FORMAT as readonly string[]).includes(format) ? (format as EventFormat) : undefined,
    organization: organization && ORGANIZATION_SLUG_PATTERN.test(organization) ? organization : undefined,
  };
}

/**
 * 該当するイベントがあり得るか。上限より長いタグは登録できないので、API に問い合わせず（400 になる）「該当なし」とする
 */
export function canMatchAnyEvent(query: EventListQuery): boolean {
  return !query.tag || query.tag.length <= TAG_MAX_LENGTH;
}

/** 一覧クエリを GET /events の query string にする。undefined は省く */
export function toEventsSearchParams(query: EventListQuery): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  return sp.toString();
}

/** 一覧の検索条件を持っているか（HOME に来た古い URL を /events へ転送するかの判定に使う） */
export function hasEventListQuery(params: Record<string, string | string[] | undefined>): boolean {
  return ["q", "tag", "status", "format", "organization"].some((k) => params[k] !== undefined);
}

/** 「LT会を探す」（/events）のリンク用。cursor / limit は含めない */
export function toEventsHref(query: EventListQuery, overrides: Partial<EventListQuery> = {}): string {
  const merged: EventListQuery = {
    q: query.q,
    tag: query.tag,
    status: query.status,
    format: query.format,
    organization: query.organization,
    ...overrides,
  };
  const qs = toEventsSearchParams(merged);
  return qs ? `/events?${qs}` : "/events";
}
