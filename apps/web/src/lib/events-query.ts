import { EVENT_STATUS, type EventListQuery, type EventStatus } from "@lt/shared";

/** URL の searchParams から一覧クエリを組み立てる。不正な値は無視する */
export function parseEventListQuery(params: Record<string, string | string[] | undefined>): EventListQuery {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const status = one("status");
  return {
    q: one("q"),
    tag: one("tag"),
    status: status && (EVENT_STATUS as readonly string[]).includes(status) ? (status as EventStatus) : undefined,
  };
}

/** 一覧クエリを GET /events の query string にする。undefined は省く */
export function toEventsSearchParams(query: EventListQuery): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  return sp.toString();
}

/** 画面のリンク用。cursor / limit は含めない */
export function toHomeHref(query: EventListQuery, overrides: Partial<EventListQuery> = {}): string {
  const merged: EventListQuery = { q: query.q, status: query.status, ...overrides };
  const qs = toEventsSearchParams(merged);
  return qs ? `/?${qs}` : "/";
}
