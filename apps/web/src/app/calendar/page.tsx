import {
  AVAILABILITY_LABEL,
  ENTRY_ROLE_LABEL,
  EVENT_FORMAT_LABEL,
  type PublicScheduleItemDto,
  type ScheduleItemDto,
} from "@lt/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDateRange, toTokyoWallClock } from "@/lib/format";

export const metadata: Metadata = { title: "カレンダー | LT会支援アプリ" };

const DAY = 24 * 60 * 60 * 1000;

/**
 * "2026-10" 形式の月。不正な値・範囲外（2000〜2100年以外）・未指定なら日本時間の今月。
 * 年を絞らないと 0000 年や 9999 年の翌月で日付の計算や API の検証が失敗し、ページがエラーになる
 */
function parseMonth(value: string | string[] | undefined): string {
  const m = typeof value === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value) : null;
  if (m && Number(m[1]) >= 2000 && Number(m[1]) <= 2100) return value as string;
  return toTokyoWallClock(new Date().toISOString()).slice(0, 7);
}

/** 月を delta だけずらす（"2026-12", 1 → "2027-01"） */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** その月の日本時間 1 日 0:00 */
function monthStart(month: string): Date {
  return new Date(`${month}-01T00:00:00+09:00`);
}

function Legend() {
  return (
    <>
      <span className="ml-1 inline-flex items-center gap-1">
        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-success-foreground" />
        開催日決定
      </span>
      <span className="ml-3 inline-flex items-center gap-1">
        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
        候補日（日程調整中）
      </span>
    </>
  );
}

export default async function CalendarPage(props: PageProps<"/calendar">) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  // みんなのカレンダーはログインなしでも見られる。自分の予定はログインが必要。
  // view の指定がなければ、今後の予定がある人は自分の予定、無い人（登録したばかりなど）はみんなの予定から始める
  const myItems =
    user && searchParams.view !== "all" ? await apiFetch<ScheduleItemDto[]>("/users/me/schedule") : null;
  const now = new Date().toISOString();
  const myUpcoming = myItems?.filter((i) => (i.endsAt ?? i.startsAt) >= now) ?? [];
  const view =
    !myItems || (searchParams.view !== "mine" && myUpcoming.length === 0) ? "all" : "mine";
  const fellBack = myItems !== null && view === "all";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <span className="eyebrow">⚡ CALENDAR</span>
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">カレンダー</h1>
        {user && (
          <nav aria-label="カレンダーの表示" className="flex gap-2">
            <Link
              href="/calendar?view=mine"
              aria-current={view === "mine" ? "page" : undefined}
              className={view === "mine" ? "btn-primary text-xs" : "btn-secondary text-xs"}
            >
              自分の予定
            </Link>
            <Link
              href="/calendar?view=all"
              aria-current={view === "all" ? "page" : undefined}
              className={view === "all" ? "btn-primary text-xs" : "btn-secondary text-xs"}
            >
              みんなの予定
            </Link>
          </nav>
        )}
      </div>
      {fellBack && (
        <p role="status" className="rounded-xl border border-primary bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
          今後の予定がまだないので、みんなの予定を表示しています。気になるLT会を選んで参加してみましょう。
        </p>
      )}
      {view === "mine" && myItems ? (
        <MyCalendar items={myItems} upcoming={myUpcoming} />
      ) : (
        <PublicCalendar month={parseMonth(searchParams.month)} />
      )}
    </div>
  );
}

/**
 * 自分が主催・回答・参加表明したLT会
 * @param upcoming 月表示のグリッドはスクリーンリーダーで追いにくいので、今後の予定をリストでも出す
 */
function MyCalendar({ items, upcoming }: { items: ScheduleItemDto[]; upcoming: ScheduleItemDto[] }) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        主催・回答・参加表明したLT会を表示します。
        <Legend />
      </p>

      <section className="card">
        <ScheduleCalendar
          items={items.map((i) => ({
            id: i.eventDateId,
            title: i.title,
            start: toTokyoWallClock(i.startsAt),
            end: i.endsAt ? toTokyoWallClock(i.endsAt) : null,
            url: `/events/${i.eventId}`,
            confirmed: i.confirmed,
          }))}
        />
      </section>

      <section className="card">
        <h2 className="mb-3 font-display font-extrabold text-foreground">今後の予定</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            予定はありません。
            <Link href="/calendar?view=all" className="font-semibold text-secondary-foreground underline">
              みんなの予定からLT会を探す
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-card-border">
            {upcoming.map((i) => (
              <li key={i.eventDateId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="font-display font-bold text-foreground">{formatDateRange(i.startsAt, i.endsAt)}</span>
                <Link href={`/events/${i.eventId}`} className="underline">
                  {i.title}
                </Link>
                <span className="ml-auto flex gap-1.5">
                  {i.role === "ORGANIZER" && <span className="badge bg-secondary text-secondary-foreground">主催</span>}
                  {i.myEntryRole && (
                    <span className="badge bg-secondary text-secondary-foreground">{ENTRY_ROLE_LABEL[i.myEntryRole]}</span>
                  )}
                  {i.confirmed ? (
                    <span className="badge bg-success-bg text-success-foreground">開催日</span>
                  ) : (
                    <span className="badge bg-muted text-muted-foreground">候補日</span>
                  )}
                  {i.myAvailability && (
                    <span className="badge bg-muted text-muted-foreground">
                      回答 {AVAILABILITY_LABEL[i.myAvailability]}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/**
 * 公開中のLT会の開催日 / 候補日。月ごとにサーバーで取得する（?month=2026-10）。
 * 月表示のグリッドには前後の月の日も並ぶので、前後 1 週間分も合わせて取る
 */
async function PublicCalendar({ month }: { month: string }) {
  const start = monthStart(month);
  const end = monthStart(shiftMonth(month, 1));
  const query = new URLSearchParams({
    from: new Date(start.getTime() - 7 * DAY).toISOString(),
    to: new Date(end.getTime() + 7 * DAY).toISOString(),
  });
  const items = await apiFetch<PublicScheduleItemDto[]>(`/schedule?${query}`);
  const inMonth = items.filter((i) => i.startsAt >= start.toISOString() && i.startsAt < end.toISOString());
  const [y, m] = month.split("-").map(Number);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        公開中のLT会の開催予定です。気になるLT会を選んで、登壇・聴講を表明しましょう。
        <Legend />
      </p>

      <section className="card">
        {/* 月が変わったら作り直して、その月を表示させる（initialDate は初回の表示にしか効かない） */}
        <ScheduleCalendar
          key={month}
          initialDate={`${month}-01`}
          navLinks={{
            prev: `/calendar?view=all&month=${shiftMonth(month, -1)}`,
            today: "/calendar?view=all",
            next: `/calendar?view=all&month=${shiftMonth(month, 1)}`,
            isCurrentMonth: month === parseMonth(undefined),
          }}
          items={items.map((i) => ({
            id: i.eventDateId,
            title: i.title,
            start: toTokyoWallClock(i.startsAt),
            end: i.endsAt ? toTokyoWallClock(i.endsAt) : null,
            // みんなの予定から来た人は参加するために開くことが多いので、参加表明の欄へ直接飛ばす
            url: `/events/${i.eventId}#entry`,
            confirmed: i.confirmed,
          }))}
        />
      </section>

      <section className="card">
        <h2 className="mb-3 font-display font-extrabold text-foreground">
          {y}年{m}月のLT会
        </h2>
        {inMonth.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            この月に予定されているLT会はありません。
            <Link href="/events/new" className="font-semibold text-secondary-foreground underline">
              LT会を作る
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-card-border">
            {inMonth.map((i) => (
              <li key={i.eventDateId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="font-display font-bold text-foreground">{formatDateRange(i.startsAt, i.endsAt)}</span>
                <Link href={`/events/${i.eventId}#entry`} className="underline">
                  {i.title}
                </Link>
                <span className="text-xs text-muted-foreground">主催: {i.organizer.displayName}</span>
                <span className="ml-auto flex gap-1.5">
                  <span className="badge bg-muted text-muted-foreground">{EVENT_FORMAT_LABEL[i.format]}</span>
                  {i.confirmed ? (
                    <span className="badge bg-success-bg text-success-foreground">開催日</span>
                  ) : (
                    <span className="badge bg-muted text-muted-foreground">候補日</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
