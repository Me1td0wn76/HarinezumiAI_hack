import {
  EVENT_FORMAT,
  EVENT_FORMAT_LABEL,
  EVENT_STATUS_LABEL,
  type EventFormat,
  type EventListQuery,
  type EventStatus,
  type TagCountDto,
} from "@lt/shared";
import Link from "next/link";
import { toHomeHref } from "@/lib/events-query";
import { TagChip } from "./tag-chip";

const STATUS_FILTERS: { value: EventStatus | undefined; label: string }[] = [
  { value: undefined, label: "すべて" },
  { value: "OPEN", label: EVENT_STATUS_LABEL.OPEN },
  { value: "CONFIRMED", label: EVENT_STATUS_LABEL.CONFIRMED },
];

const FORMAT_FILTERS: { value: EventFormat | undefined; label: string }[] = [
  { value: undefined, label: "形式: すべて" },
  ...EVENT_FORMAT.map((f) => ({ value: f, label: EVENT_FORMAT_LABEL[f] })),
];

const chip = (active: boolean) =>
  `badge ${active ? "bg-stone-800 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`;

/** 検索欄・状態フィルタ・開催形式フィルタ・人気タグ。すべて GET リンク / フォームなので JS 不要 */
export function DiscoverControls({ query, topTags }: { query: EventListQuery; topTags: TagCountDto[] }) {
  return (
    <div className="space-y-3">
      <form action="/" method="get" className="flex gap-2">
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.format ? <input type="hidden" name="format" value={query.format} /> : null}
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
        <span className="mx-1 text-stone-300" aria-hidden="true">
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
          <Link href={toHomeHref(query, { q: undefined })} className="text-xs text-stone-500 underline">
            「{query.q}」の検索を解除
          </Link>
        ) : null}
      </div>

      {topTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-stone-400">タグ:</span>
          {topTags.map((t) => (
            <TagChip key={t.tag} tag={t.tag} count={t.count} active={t.tag === query.tag} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
