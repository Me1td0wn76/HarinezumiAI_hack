import {
  EVENT_FORMAT,
  EVENT_FORMAT_LABEL,
  EVENT_STATUS,
  EVENT_STATUS_LABEL,
  type EventFormat,
  type EventListQuery,
  type EventStatus,
  type OrganizationSummaryDto,
  type TagCountDto,
} from "@lt/shared";
import Link from "next/link";
import { toEventsHref } from "@/lib/events-query";
import { TagChip } from "./tag-chip";
import { TypingSearchInput } from "./typing-search-input";

const STATUS_FILTERS: { value: EventStatus | undefined; label: string }[] = [
  { value: undefined, label: "すべて" },
  ...EVENT_STATUS.map((s) => ({ value: s, label: EVENT_STATUS_LABEL[s] })),
];

const FORMAT_FILTERS: { value: EventFormat | undefined; label: string }[] = [
  { value: undefined, label: "形式: すべて" },
  ...EVENT_FORMAT.map((f) => ({ value: f, label: EVENT_FORMAT_LABEL[f] })),
];

/**
 * 検索欄と状態のタブ。「LT会を探す」の黄色い見出しエリアに置く。
 * どれも GET リンク / フォームなので JS 不要（検索欄の例の打ち込みだけ JS の飾り）
 */
export function DiscoverSearch({ query }: { query: EventListQuery }) {
  return (
    <div className="space-y-5">
      <form action="/events" method="get" role="search" className="flex max-w-3xl gap-3">
        {query.tag ? <input type="hidden" name="tag" value={query.tag} /> : null}
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.format ? <input type="hidden" name="format" value={query.format} /> : null}
        {query.organization ? <input type="hidden" name="organization" value={query.organization} /> : null}
        {/* 空のときは、何を探せるかの例が1文字ずつ打ち込まれる */}
        <TypingSearchInput
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="タイトルや内容で検索（例: Rust, デザイン）"
          className="h-14 w-full rounded-full border-2 border-white bg-white px-6 text-base text-foreground shadow-[0_6px_18px_rgba(224,150,0,0.18)] outline-none transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/30"
          aria-label="LT会を検索"
        />
        <button type="submit" className="btn-primary h-14 shrink-0 px-7 text-base">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          検索
        </button>
      </form>
      <nav aria-label="状態で絞り込む" className="flex flex-wrap gap-x-7 gap-y-1">
        {STATUS_FILTERS.map((f) => {
          const active = (query.status ?? undefined) === f.value;
          return (
            <Link
              key={f.label}
              href={toEventsHref(query, { status: f.value })}
              className={`tab ${active ? "tab-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * 開催形式・団体の絞り込みと人気のタグ。一覧の上に置く
 * @param organizations 団体フィルタの選択肢（ログイン中なら自分の所属団体）
 */
export function DiscoverFilters({
  query,
  topTags,
  organizations = [],
}: {
  query: EventListQuery;
  topTags: TagCountDto[];
  organizations?: OrganizationSummaryDto[];
}) {
  // 所属していない団体で絞り込んでいる（団体ページのリンクから来たなど）ときも、解除できるよう選択肢に出す
  const orgFilters =
    query.organization && !organizations.some((o) => o.slug === query.organization)
      ? [...organizations, { id: query.organization, slug: query.organization, name: query.organization }]
      : organizations;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-display text-sm font-black">開催形式</span>
        {FORMAT_FILTERS.map((f) => {
          const active = (query.format ?? undefined) === f.value;
          return (
            <Link
              key={f.label}
              href={toEventsHref(query, { format: f.value })}
              className={`pill ${active ? "pill-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {f.label}
            </Link>
          );
        })}
        {query.q ? (
          <Link
            href={toEventsHref(query, { q: undefined })}
            className="ml-2 text-sm font-bold underline decoration-accent decoration-2 underline-offset-4"
          >
            「{query.q}」の検索を解除
          </Link>
        ) : null}
      </div>

      {orgFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-display text-sm font-black">団体</span>
          {[{ slug: undefined, name: "すべて" }, ...orgFilters].map((o) => {
            const active = query.organization === o.slug;
            return (
              <Link
                key={o.slug ?? ""}
                href={toEventsHref(query, { organization: o.slug })}
                className={`pill ${active ? "pill-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {o.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      {topTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-display text-sm font-black">人気のタグ</span>
          {topTags.map((t) => (
            <TagChip key={t.tag} tag={t.tag} count={t.count} active={t.tag === query.tag} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
