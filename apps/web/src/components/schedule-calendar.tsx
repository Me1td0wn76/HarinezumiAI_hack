"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import jaLocale from "@fullcalendar/react/locales/ja";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

export interface CalendarItem {
  id: string;
  title: string;
  /** 日本時間の壁時計の時刻（"2026-10-05T18:00"）。toTokyoWallClock() で作る */
  start: string;
  end: string | null;
  url: string;
  confirmed: boolean;
}

/**
 * 自分が主催・回答したLT会の月表示カレンダー。確定日は緑、候補日は黄色。クリックで詳細へ。
 * 日時は日本時間の壁時計の値を渡し、timeZone: 'UTC' でそのまま並べる
 * （名前付きタイムゾーンを使うにはプラグインが要るため。表示は lib/format.ts と同じく日本時間固定）
 */
export function ScheduleCalendar({ items }: { items: CalendarItem[] }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, classicThemePlugin]}
      initialView="dayGridMonth"
      locale={jaLocale}
      timeZone="UTC"
      height="auto"
      fixedWeekCount={false}
      headerToolbar={{ start: "title", end: "today prev,next" }}
      // 時刻付きの予定も色付きの帯で出す（既定の点表示だと確定 / 候補の色が見分けにくい）
      eventDisplay="block"
      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      events={items.map((i) => ({
        id: i.id,
        title: i.confirmed ? `✅ ${i.title}` : i.title,
        start: i.start,
        end: i.end ?? undefined,
        url: i.url,
        color: i.confirmed ? "var(--color-success-foreground)" : "var(--color-primary)",
        contrastColor: i.confirmed ? "#fff" : "var(--color-primary-foreground)",
      }))}
    />
  );
}
