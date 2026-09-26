import type { EventSummaryDto, PageDto, TagCountDto } from "@lt/shared";
import Link from "next/link";
import { DiscoverControls } from "@/components/discover-controls";
import { EventList } from "@/components/event-list";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getMyOrganizations } from "@/lib/organizations";
import { EMPTY_EVENT_PAGE, canMatchAnyEvent, parseEventListQuery, toEventsSearchParams } from "@/lib/events-query";

export default async function HomePage(props: PageProps<"/">) {
  const query = parseEventListQuery(await props.searchParams);
  const qs = toEventsSearchParams(query);
  const filtering = qs.length > 0;

  // 互いに依存しないので並列に取る
  const [page, topTags, user, myOrganizations] = await Promise.all([
    canMatchAnyEvent(query)
      ? apiFetch<PageDto<EventSummaryDto>>(`/events${filtering ? `?${qs}` : ""}`, { auth: false })
      : EMPTY_EVENT_PAGE,
    apiFetch<TagCountDto[]>("/tags?limit=15", { auth: false }),
    getCurrentUser(),
    getMyOrganizations(),
  ]);

  return (
    <>
      {/*
        Hero: layout.tsx の <main> は余白を持たないので、この section 自体が画面幅いっぱいに広がる。
        中の文字だけ mx-auto max-w-4xl px-4 で中央寄せする（px-4 は Nav のロゴと同じ左端に揃えるため）
      */}
      <section className="border-b border-card-border bg-linear-160 from-secondary/40 to-background">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <span className="eyebrow mb-5">⚡ LIGHTNING TALK</span>
          <h1 className="mb-4 font-display text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
            LT会を
            <br />
            {/* 黄色い文字色は背景とのコントラストがWCAG AA基準(3:1)を満たせないため、
                文字色ではなく背景を黄色にした「マーカーで線を引く」表現に変更 */}
            <span className="rounded-lg bg-primary px-2 text-foreground">もっと気軽に</span>
            <br />
            始めよう
          </h1>
          <p className="mb-7 max-w-md text-base leading-relaxed text-muted-foreground">
            発表者が内容と候補日を登録して、参加者は○△×で回答するだけ。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link href="/events/new" className="btn-primary">
                ⚡ LT会を作る
              </Link>
            ) : (
              <Link href="/register" className="btn-primary">
                ⚡ 登録してLT会を作る
              </Link>
            )}
            <span className="text-sm text-subtle">回答は共有URLからログイン不要でできます</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold text-foreground">LT会を探す</h2>
          {filtering ? (
            <Link href="/" className="text-sm font-semibold text-secondary-foreground underline">
              絞り込みを解除
            </Link>
          ) : null}
        </div>

        {/* TODO(#8): ログイン時に「新着 / フォロー中」タブを置く。フォロー中は GET /feed（#8 で追加）を使う */}
        <DiscoverControls query={query} topTags={topTags} organizations={myOrganizations} />

        {/* 検索条件が変わったら一覧の state を作り直す */}
        <EventList key={qs} initial={page} query={query} />

        {!user && page.items.length === 0 && !filtering ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/register" className="font-semibold text-secondary-foreground underline">
              登録
            </Link>
            して最初のLT会を立ててみましょう。
          </p>
        ) : null}
      </div>
    </>
  );
}
