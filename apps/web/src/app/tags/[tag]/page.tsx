import type { EventSummaryDto, PageDto } from "@lt/shared";
import Link from "next/link";
import { EventList } from "@/components/event-list";
import { apiFetch } from "@/lib/api";
import { toEventsSearchParams } from "@/lib/events-query";

/** タグで絞り込んだ一覧 */
export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag: raw } = await props.params;
  const tag = decodeURIComponent(raw).toLowerCase();
  const query = { tag };
  const page = await apiFetch<PageDto<EventSummaryDto>>(`/events?${toEventsSearchParams(query)}`, { auth: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← LT会を探す
        </Link>
        <h1 className="mt-1 text-xl font-bold">#{tag}</h1>
      </div>
      <EventList key={tag} initial={page} query={query} />
    </div>
  );
}
