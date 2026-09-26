import type { EventSummaryDto, PageDto, TagCountDto } from "@lt/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { DiscoverFilters, DiscoverSearch } from "@/components/discover-controls";
import { EventList } from "@/components/event-list";
import { HeroShapes } from "@/components/hero-shapes";
import { TagMarquee } from "@/components/tag-marquee";
import { apiFetch } from "@/lib/api";
import { getMyOrganizations } from "@/lib/organizations";
import { EMPTY_EVENT_PAGE, canMatchAnyEvent, parseEventListQuery, toEventsSearchParams } from "@/lib/events-query";

export const metadata: Metadata = { title: "LT会を探す" };

/** LT会を探す（新着順の一覧・検索・絞り込み）。以前はトップページにあったものをここへ移した */
export default async function EventsPage(props: PageProps<"/events">) {
  const query = parseEventListQuery(await props.searchParams);
  const qs = toEventsSearchParams(query);
  const filtering = qs.length > 0;

  // 互いに依存しないので並列に取る
  const [page, topTags, myOrganizations] = await Promise.all([
    canMatchAnyEvent(query)
      ? apiFetch<PageDto<EventSummaryDto>>(`/events${filtering ? `?${qs}` : ""}`, { auth: false })
      : EMPTY_EVENT_PAGE,
    apiFetch<TagCountDto[]>("/tags?limit=15", { auth: false }),
    getMyOrganizations(),
  ]);

  return (
    <>
      {/* ヘッダーから続く黄色い見出しエリア。この section 自体が画面幅いっぱいに広がり、中身だけ中央寄せする */}
      <section className="relative overflow-hidden bg-sunny">
        <HeroShapes size="small" />
        <div className="relative mx-auto max-w-5xl space-y-6 px-4 pt-6 pb-8">
          <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">LT会を探す</h1>
          <DiscoverSearch query={query} />
        </div>
        {/* 人気のタグが帯の下でゆっくり流れる */}
        <TagMarquee tags={topTags} />
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <DiscoverFilters query={query} topTags={topTags} organizations={myOrganizations} />

        <p className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 text-sm font-bold">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-strong" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          日程調整中のLT会は、候補日に ○△× で回答すると、開催日が決まったときに通知が届きます
        </p>

        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-black">{filtering ? "検索結果" : "新着のLT会"}</h2>
          {filtering ? (
            <Link href="/events" className="text-sm font-bold underline decoration-accent decoration-2 underline-offset-4">
              絞り込みを解除
            </Link>
          ) : null}
        </div>

        {/* TODO(#8): ログイン時に「新着 / フォロー中」タブを置く。フォロー中は GET /feed（#8 で追加）を使う */}
        {/* 検索条件が変わったら一覧の state を作り直す */}
        <EventList key={qs} initial={page} query={query} />
      </div>
    </>
  );
}
