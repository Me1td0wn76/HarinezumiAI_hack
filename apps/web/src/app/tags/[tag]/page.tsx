import type { EventSummaryDto, PageDto } from "@lt/shared";
import Link from "next/link";
import { EventList } from "@/components/event-list";
import { apiFetch } from "@/lib/api";
import { EMPTY_EVENT_PAGE, canMatchAnyEvent, toEventsSearchParams } from "@/lib/events-query";

/** タグで絞り込んだ一覧 */
export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag: raw } = await props.params;
  const tag = decodeURIComponent(raw).toLowerCase();
  const query = { tag };
  const page = canMatchAnyEvent(query)
    ? await apiFetch<PageDto<EventSummaryDto>>(`/events?${toEventsSearchParams(query)}`, { auth: false })
    : EMPTY_EVENT_PAGE;

  // layout.tsx の <main> は余白を持たないため、ページ側でコンテナを持つ
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <Link href="/events" className="text-sm text-subtle hover:text-foreground">
          ← LT会を探す
        </Link>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-foreground">#{tag}</h1>
      </div>
      <EventList key={tag} initial={page} query={query} />
    </div>
  );
}
