import { AVAILABILITY_LABEL, type ScheduleItemDto } from "@lt/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { formatDateRange, toTokyoWallClock } from "@/lib/format";

export const metadata: Metadata = { title: "カレンダー | LT会支援アプリ" };

export default async function CalendarPage() {
  await requireUser();
  const items = await apiFetch<ScheduleItemDto[]>("/users/me/schedule");
  const now = new Date().toISOString();
  // 月表示のグリッドはスクリーンリーダーで追いにくいので、今後の予定をリストでも出す
  const upcoming = items.filter((i) => (i.endsAt ?? i.startsAt) >= now);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <span className="eyebrow">⚡ CALENDAR</span>
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">カレンダー</h1>
        <p className="text-sm text-muted-foreground">
          主催・回答したLT会を表示します。
          <span className="ml-1 inline-flex items-center gap-1">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-success-foreground" />
            開催日決定
          </span>
          <span className="ml-3 inline-flex items-center gap-1">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            候補日（日程調整中）
          </span>
        </p>
      </div>

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
            <Link href="/" className="font-semibold text-secondary-foreground underline">
              LT会を探す
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
    </div>
  );
}
