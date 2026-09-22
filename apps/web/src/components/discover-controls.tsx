import { EVENT_STATUS_LABEL, type EventListQuery, type EventStatus, type TagCountDto } from "@lt/shared";
import Link from "next/link";
import { toHomeHref } from "@/lib/events-query";
import { TagChip } from "./tag-chip";

const STATUS_FILTERS: { value: EventStatus | undefined; label: string }[] = [
  { value: undefined, label: "すべて" },
  { value: "OPEN", label: EVENT_STATUS_LABEL.OPEN },
  { value: "CONFIRMED", label: EVENT_STATUS_LABEL.CONFIRMED },
];

/** 検索欄・状態フィルタ・人気タグ。すべて GET リンク / フォームなので JS 不要 */
export function DiscoverControls({ query, topTags }: { query: EventListQuery; topTags: TagCountDto[] }) {
  return (
    <div className="space-y-3">
      <form action="/" method="get" className="flex gap-2">
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
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
              className={`badge transition ${active ? "bg-foreground text-background" : "border-[1.5px] border-border bg-card text-muted-foreground hover:border-primary"}`}
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
