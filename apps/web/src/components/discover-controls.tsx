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
import { toHomeHref } from "@/lib/events-query";
import { TagChip } from "./tag-chip";

const STATUS_FILTERS: { value: EventStatus | undefined; label: string }[] = [
  { value: undefined, label: "すべて" },
  ...EVENT_STATUS.map((s) => ({ value: s, label: EVENT_STATUS_LABEL[s] })),
];

const FORMAT_FILTERS: { value: EventFormat | undefined; label: string }[] = [
  { value: undefined, label: "形式: すべて" },
  ...EVENT_FORMAT.map((f) => ({ value: f, label: EVENT_FORMAT_LABEL[f] })),
];

const chip = (active: boolean) =>
  `badge transition ${active ? "bg-foreground text-background" : "border-[1.5px] border-border bg-card text-muted-foreground hover:border-primary"}`;

/**
 * 検索欄・状態フィルタ・開催形式フィルタ・団体フィルタ・人気タグ。すべて GET リンク / フォームなので JS 不要
 * @param organizations 団体フィルタの選択肢（ログイン中なら自分の所属団体）
 */
export function DiscoverControls({
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
    <div className="space-y-3">
      <form action="/" method="get" className="flex gap-2">
        {query.tag ? <input type="hidden" name="tag" value={query.tag} /> : null}
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.format ? <input type="hidden" name="format" value={query.format} /> : null}
        {query.organization ? <input type="hidden" name="organization" value={query.organization} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="タイトルや内容で検索"
          className="input"
          aria-label="LT会を検索"
        />
        <button type="submit" className="btn-secondary shrink-0">
          検索
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STATUS_FILTERS.map((f) => {
          const active = (query.status ?? undefined) === f.value;
          return (
            <Link
              key={f.label}
              href={toHomeHref(query, { status: f.value })}
              className={chip(active)}
              aria-current={active ? "page" : undefined}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="mx-1 text-border-strong" aria-hidden="true">
          |
        </span>
        {FORMAT_FILTERS.map((f) => {
          const active = (query.format ?? undefined) === f.value;
          return (
            <Link
              key={f.label}
              href={toHomeHref(query, { format: f.value })}
              className={chip(active)}
              aria-current={active ? "page" : undefined}
            >
              {f.label}
            </Link>
          );
        })}
        {query.q ? (
          <Link href={toHomeHref(query, { q: undefined })} className="text-xs font-semibold text-secondary-foreground underline">
            「{query.q}」の検索を解除
          </Link>
        ) : null}
      </div>

      {orgFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 font-display text-xs font-bold text-subtle">団体:</span>
          {[{ slug: undefined, name: "すべて" }, ...orgFilters].map((o) => {
            const active = query.organization === o.slug;
            return (
              <Link
                key={o.slug ?? ""}
                href={toHomeHref(query, { organization: o.slug })}
                className={chip(active)}
                aria-current={active ? "page" : undefined}
              >
                {o.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      {topTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-display text-xs font-bold text-subtle">タグ:</span>
          {topTags.map((t) => (
            <TagChip key={t.tag} tag={t.tag} count={t.count} active={t.tag === query.tag} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
