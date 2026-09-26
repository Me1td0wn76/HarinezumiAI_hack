import { EVENT_FORMAT_LABEL, type PublicScheduleDto, type PublicScheduleItemDto, type TagCountDto } from "@lt/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FleeingShapes } from "@/components/fleeing-shapes";
import { HeroShapes } from "@/components/hero-shapes";
import { Reveal } from "@/components/reveal";
import { TagChip } from "@/components/tag-chip";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { hasEventListQuery, parseEventListQuery, toEventsHref } from "@/lib/events-query";
import { formatDateRange, toTokyoWallClock } from "@/lib/format";

const DAY = 24 * 60 * 60 * 1000;
/** 「近日開催のLT会」に出す期間（日）。API の上限（PUBLIC_SCHEDULE_MAX_DAYS）より短くする */
const UPCOMING_DAYS = 60;

interface UpcomingEvent {
  first: PublicScheduleItemDto;
  /** 期間内の候補日の数（調整中のLT会）。決定済みなら 1 */
  dateCount: number;
}

/** 今から UPCOMING_DAYS 日の公開中のLT会の予定（ログインしていればブロックした相手の分は API が除く） */
function loadUpcomingSchedule(): Promise<PublicScheduleDto> {
  const now = Date.now();
  const query = new URLSearchParams({
    from: new Date(now).toISOString(),
    to: new Date(now + UPCOMING_DAYS * DAY).toISOString(),
  });
  return apiFetch<PublicScheduleDto>(`/schedule?${query}`);
}

/** 日付単位の予定を、LT会ごとに一番早い日へまとめて先頭から count 件 */
function pickUpcoming(items: PublicScheduleItemDto[], count: number): UpcomingEvent[] {
  const byEvent = new Map<string, UpcomingEvent>();
  for (const item of items) {
    const found = byEvent.get(item.eventId);
    if (found) found.dateCount++;
    else byEvent.set(item.eventId, { first: item, dateCount: 1 });
  }
  return [...byEvent.values()].slice(0, count);
}

/** "2026-10-18T19:00" → "10.18"（日本時間） */
function shortDate(iso: string): string {
  const [, m, d] = toTokyoWallClock(iso).slice(0, 10).split("-").map(Number);
  return `${m}.${d}`;
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-strong" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/** HOME。LT会を気軽に始めてもらう入口で、各機能へ移動できる */
export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  // 以前はトップページが一覧だったので、/?q=… や /?tag=… のリンク・ブックマークは「LT会を探す」へ転送する
  if (hasEventListQuery(searchParams)) redirect(toEventsHref(parseEventListQuery(searchParams)));

  // 3つは互いに依存しないので並列に取る
  const [user, schedule, topTags] = await Promise.all([
    getCurrentUser(),
    loadUpcomingSchedule(),
    apiFetch<TagCountDto[]>("/tags?limit=8", { auth: false }),
  ]);
  const upcoming = pickUpcoming(schedule.items, 3);
  const createHref = user ? "/events/new" : "/register";

  return (
    <>
      <section className="relative overflow-hidden bg-sunny">
        <HeroShapes />
        <div className="relative mx-auto max-w-5xl px-4 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="max-w-2xl space-y-8">
            {/* スマホでも「もっと気軽に」が1行に収まる大きさから始める */}
            <h1 className="font-display text-5xl leading-[1.12] font-black tracking-tight sm:text-7xl lg:text-8xl">
              LT会を
              <br />
              もっと気軽に
              <br />
              始めよう。
            </h1>
            <p className="text-lg leading-relaxed font-medium sm:text-xl">
              タイトルと候補日を書くだけ。集まって、話して、また次へ。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={createHref} className="btn-primary h-14 px-8 text-base">
                {user ? "LT会を作る" : "登録してLT会を作る"}
              </Link>
              <Link href="/events" className="btn-secondary h-14 px-8 text-base">
                LT会を探す
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
              <li className="flex items-center gap-2">
                <Check />
                日程は ○△× で決める
              </li>
              <li className="flex items-center gap-2">
                <Check />
                共有URLならログインなしで回答
              </li>
              <li className="flex items-center gap-2">
                <Check />
                登壇・聴講をワンタップで表明
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16">
        {/* data-transition を付けた箱（近日開催のLT会・どこから始める？の2つ）だけ、押すと箱と同じ色の幕がよぎって画面が切り替わる */}
        <section aria-labelledby="upcoming" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Reveal className="space-y-1">
              <h2 id="upcoming" className="font-display text-4xl font-black tracking-tight">
                <span className="lt-marker">近日開催のLT会</span>
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                日程調整中のLT会は、候補日に回答すると開催日決定の通知が届きます
              </p>
            </Reveal>
            <FleeingShapes className="ml-auto mr-6" />
            <Link href="/calendar?view=all" className="text-base font-bold underline decoration-accent decoration-[3px] underline-offset-[6px]">
              カレンダーで見る →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <p className="font-display text-lg font-black">これから{UPCOMING_DAYS}日のLT会はまだありません</p>
              <Link href={createHref} className="btn-primary">
                最初のLT会を立てる
              </Link>
            </div>
          ) : (
            <ul className="grid gap-5 md:grid-cols-3">
              {upcoming.map(({ first, dateCount }, i) => (
                <Reveal as="li" key={first.eventId} delay={i * 110} tilt={i % 2 ? 3 : -3}>
                  <Link href={`/events/${first.eventId}`} data-transition="" className="card card-hover flex h-full flex-col gap-3">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${first.confirmed ? "bg-success" : "bg-accent"}`} />
                      {first.confirmed ? "開催日決定" : "日程調整中"}・{EVENT_FORMAT_LABEL[first.format]}
                    </span>
                    <span className="font-display text-4xl font-black text-accent-strong">
                      {shortDate(first.startsAt)}
                      {!first.confirmed && <span className="ml-1 text-xl">〜</span>}
                    </span>
                    <span className="font-display text-xl leading-snug font-black">{first.title}</span>
                    <span className="mt-auto text-sm font-bold text-muted-foreground">
                      {first.confirmed
                        ? formatDateRange(first.startsAt, first.endsAt)
                        : `候補日 ${dateCount} 件・主催 ${first.organizer.displayName}`}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
          {topTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 font-display text-sm font-black">人気のタグ</span>
              {topTags.map((t) => (
                <TagChip key={t.tag} tag={t.tag} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="start" className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <Reveal>
              <h2 id="start" className="font-display text-4xl font-black tracking-tight">
                <span className="lt-marker">どこから始める？</span>
              </h2>
            </Reveal>
            <FleeingShapes className="mr-6" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal tilt={-3}>
              <Link href="/events" data-transition="#ffe45c" className="card-hover flex h-full min-h-56 flex-col justify-between gap-6 rounded-[2rem] bg-sunny p-9">
                <span className="text-sm font-bold">01　新着・タグ・キーワードで見つける</span>
                <span className="font-display text-4xl font-black sm:text-5xl">LT会を探す →</span>
              </Link>
            </Reveal>
            <Reveal delay={110} tilt={3}>
              <Link href={createHref} data-transition="#ffd7b0" className="card-hover flex h-full min-h-56 flex-col justify-between gap-6 rounded-[2rem] bg-peach p-9">
                <span className="text-sm font-bold">02　タイトルと候補日だけで立てられる</span>
                <span className="font-display text-4xl font-black sm:text-5xl">LT会を作る →</span>
              </Link>
            </Reveal>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/calendar", title: "カレンダー", body: "みんなの予定から選んで、登壇・聴講を表明する" },
              { href: "/notifications", title: "通知", body: "開催日の決定や、主催したLT会への登壇の表明が届く" },
              { href: "/me", title: "マイページ", body: "主催・参加したLT会の履歴とプロフィール" },
            ].map((item, i) => (
              <Reveal as="li" key={item.href} delay={i * 90}>
                <Link
                  href={item.href}
                  className="block space-y-2 border-t-[3px] border-primary py-5 transition-[padding] duration-300 hover:pl-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <span className="block font-display text-xl font-black">{item.title} →</span>
                  <span className="block text-sm leading-relaxed">{item.body}</span>
                </Link>
              </Reveal>
            ))}
            <Reveal as="li" delay={270} className="space-y-2 border-t-[3px] border-primary py-5">
              <span className="block font-display text-xl font-black">共有URLで回答</span>
              <span className="block text-sm leading-relaxed">主催者からもらったURLなら、ログインなしで ○△× に答えられる</span>
            </Reveal>
          </ul>
        </section>

        <section aria-labelledby="flow" className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <Reveal>
              <h2 id="flow" className="font-display text-4xl font-black tracking-tight">
                <span className="lt-marker">LT会ができるまで</span>
              </h2>
            </Reveal>
            <FleeingShapes className="mr-6" />
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {[
              { title: "立てる", body: "話したいことと候補日を書いて公開。共有URLを Discord や LINE に貼って呼びかける" },
              { title: "集まる", body: "参加者は候補日に ○△× で回答し、登壇するか聴講するかを表明する" },
              { title: "決まる", body: "集まりやすい日に開催日を決定。回答した人に通知が届き、配信URLも見られるようになる" },
            ].map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 110} tilt={i % 2 ? 3 : -3} className="card space-y-3">
                <span className="block font-display text-5xl leading-none font-black text-accent-strong">
                  <span className="lt-pop">{i + 1}</span>
                </span>
                <span className="block font-display text-2xl font-black">{step.title}</span>
                <span className="block text-sm leading-relaxed font-medium">{step.body}</span>
              </Reveal>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
