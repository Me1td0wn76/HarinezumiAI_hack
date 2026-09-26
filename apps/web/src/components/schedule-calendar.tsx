"use client";

import FullCalendar, { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import jaLocale from "@fullcalendar/react/locales/ja";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { toTokyoWallClock } from "@/lib/format";

export interface CalendarItem {
  id: string;
  title: string;
  /** 日本時間の壁時計の時刻（"2026-10-05T18:00"）。toTokyoWallClock() で作る */
  start: string;
  end: string | null;
  url: string;
  confirmed: boolean;
}

/** 月の移動をページのリンクで行うときの行き先（月ごとにサーバーで取得する場合） */
export interface CalendarNavLinks {
  prev: string;
  today: string;
  next: string;
  /** 表示中の月が今月か。今月なら「今月」ボタンを押せない見た目にする */
  isCurrentMonth: boolean;
}

/** "2026-10-01" → "2026年10月"。カレンダーが描画される前の見出しに使う */
function monthTitle(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return `${y}年${m}月`;
}

/**
 * LT会の月表示カレンダー。確定日は緑、候補日は黄色。クリックで詳細へ。
 * 日時は日本時間の壁時計の値を渡し、timeZone: 'UTC' でそのまま並べる
 * （名前付きタイムゾーンを使うにはプラグインが要るため。表示は lib/format.ts と同じく日本時間固定）。
 * 見出しと月の移動は FullCalendar のツールバーを使わず自前で描く（アプリのボタンと見た目を揃えるため）
 */
export function ScheduleCalendar({
  items,
  initialDate,
  navLinks,
}: {
  items: CalendarItem[];
  /** 最初に表示する月の日付（"2026-10-01"）。省略時は今月 */
  initialDate?: string;
  /**
   * 指定すると、月の移動をこのリンク（ページ遷移）で行う。省略時はカレンダー内で移動する（items に全期間を渡す場合）
   */
  navLinks?: CalendarNavLinks;
}) {
  // 日付が変わるたびに再描画されるので、見出しとボタンの状態を controller から読める
  const controller = useCalendarController();
  const buttons = controller.view ? controller.getButtonState() : null;
  const title = controller.view?.title ?? monthTitle(initialDate ?? toTokyoWallClock(new Date().toISOString()));

  return (
    <div className="lt-calendar">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-black tracking-tight text-foreground" aria-live="polite">
          {title}
        </h2>
        <div
          role="group"
          aria-label="表示する月の移動"
          className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-card-border bg-muted p-1"
        >
          {navLinks ? (
            <>
              <NavLink href={navLinks.prev} label="前の月" icon />
              <NavLink href={navLinks.today} label="今月" current={navLinks.isCurrentMonth} />
              <NavLink href={navLinks.next} label="次の月" icon />
            </>
          ) : (
            <>
              <NavButton onClick={() => controller.prev()} label="前の月" icon />
              <NavButton
                onClick={() => controller.today()}
                label="今月"
                current={buttons?.today.isDisabled ?? true}
              />
              <NavButton onClick={() => controller.next()} label="次の月" icon />
            </>
          )}
        </div>
      </div>

      <FullCalendar
        controller={controller}
        plugins={[dayGridPlugin, classicThemePlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={jaLocale}
        timeZone="UTC"
        // 「今日」も日本時間の壁時計で渡す。timeZone: 'UTC' のままだと日本時間 0〜9 時は前日が今日になる
        now={() => toTokyoWallClock(new Date().toISOString())}
        height="auto"
        fixedWeekCount={false}
        headerToolbar={false}
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
    </div>
  );
}

/**
 * 前後の月は丸い矢印ボタン、「今月」は黄色のピル。今月を表示中のときは「今月」を押せない見た目にする
 */
function navClass(icon: boolean | undefined, current: boolean | undefined): string {
  const base =
    "inline-flex h-9 items-center justify-center rounded-full font-display text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40";
  if (icon) {
    return `${base} w-9 bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_3px_10px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] active:translate-y-0`;
  }
  if (current) {
    return `${base} cursor-default px-4 text-muted-foreground`;
  }
  return `${base} bg-primary px-4 text-primary-foreground shadow-[0_2px_8px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] hover:-translate-y-0.5 hover:bg-primary-hover active:translate-y-0`;
}

function NavContent({ label, icon }: { label: string; icon?: boolean }): ReactNode {
  if (!icon) return label;
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path
          d={label === "前の月" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </>
  );
}

function NavButton({
  onClick,
  label,
  icon,
  current,
}: {
  onClick: () => void;
  label: string;
  icon?: boolean;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={current}
      aria-current={current ? "date" : undefined}
      title={icon ? label : undefined}
      className={navClass(icon, current)}
    >
      <NavContent label={label} icon={icon} />
    </button>
  );
}

function NavLink({ href, label, icon, current }: { href: string; label: string; icon?: boolean; current?: boolean }) {
  if (current) {
    // 今月を表示中なら移動先がないので、リンクにせず状態だけ示す
    return (
      <span aria-current="date" className={navClass(icon, current)}>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} title={icon ? label : undefined} className={navClass(icon, current)}>
      <NavContent label={label} icon={icon} />
    </Link>
  );
}
