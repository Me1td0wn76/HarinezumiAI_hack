import type { EventSummaryDto, PageDto, TagCountDto } from "@lt/shared";
import Link from "next/link";
import { DiscoverControls } from "@/components/discover-controls";
import { EventList } from "@/components/event-list";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { parseEventListQuery, toEventsSearchParams } from "@/lib/events-query";

export default async function HomePage(props: PageProps<"/">) {
  const query = parseEventListQuery(await props.searchParams);
  const qs = toEventsSearchParams(query);

  // 3つは互いに依存しないので並列に取る
  const [page, topTags, user] = await Promise.all([
    apiFetch<PageDto<EventSummaryDto>>(`/events${qs ? `?${qs}` : ""}`, { auth: false }),
    apiFetch<TagCountDto[]>("/tags?limit=15", { auth: false }),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">LT会を探す</h1>
        {user ? (
          <Link href="/events/new" className="btn-primary">
            ＋ LT会を作る
          </Link>
        ) : null}
      </div>

      {/* TODO(#8): ログイン時に「新着 / フォロー中」タブを置く。フォロー中は GET /feed（#8 で追加）を使う */}
      <DiscoverControls query={query} topTags={topTags} />

      {/* 検索条件が変わったら一覧の state を作り直す */}
      <EventList key={qs} initial={page} query={query} />

      {!user && page.items.length === 0 ? (
        <p className="text-center text-sm text-stone-500">
          <Link href="/register" className="text-emerald-700 underline">
            登録
          </Link>
          して最初のLT会を立ててみましょう。
        </p>
      ) : null}
    </div>
  );
}
