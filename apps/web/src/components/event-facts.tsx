import { EVENT_FORMAT_LABEL, type EventDetailDto } from "@lt/shared";
import type { ReactNode } from "react";
import { formatDateRange, formatMonthDay } from "@/lib/format";

/** 候補日を短く並べる数。これより多いときは「ほか N 件」にまとめる */
const SHOWN_DATES = 3;

function Fact({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[1.4rem] bg-card p-5">
      <dt className="text-sm font-bold text-muted-foreground">{label}</dt>
      <dd className="font-display text-lg leading-snug font-black [overflow-wrap:anywhere]">{value}</dd>
      {children && <dd className="text-sm leading-relaxed font-medium [overflow-wrap:anywhere]">{children}</dd>}
    </div>
  );
}

/**
 * LT会詳細ページの「日時・開催形式・参加状況」の3つの箱。
 * 配信URL は API 側で閲覧者に応じて出し分け済み（主催者 / 開催日決定後の回答者のみ）。
 */
export function EventFacts({ detail }: { detail: EventDetailDto }) {
  const { candidateDates, confirmedDate, entries } = detail;
  const speakers = entries.filter((e) => e.role === "SPEAKER").length;
  const audience = entries.length - speakers;
  const urlPending = !detail.meetingUrl && detail.hasMeetingUrl;

  let dateValue: string;
  let dateNote: string;
  if (confirmedDate) {
    dateValue = formatDateRange(confirmedDate.startsAt, confirmedDate.endsAt);
    dateNote = detail.status === "CLOSED" ? "終了しました" : "開催日決定";
  } else if (detail.status === "CLOSED") {
    dateValue = "終了";
    dateNote = "開催日を決めずに終了しました";
  } else if (candidateDates.length === 0) {
    dateValue = "調整中";
    dateNote = "候補日がまだありません";
  } else {
    const rest = candidateDates.length - SHOWN_DATES;
    dateValue = "日程調整中";
    dateNote =
      `候補 ${candidateDates.length}件: ` +
      candidateDates
        .slice(0, SHOWN_DATES)
        .map((d) => formatMonthDay(d.startsAt))
        .join("・") + (rest > 0 ? ` ほか${rest}件` : "");
  }

  return (
    <dl aria-label="開催情報" className="grid gap-4 sm:grid-cols-3">
      <Fact label="日時" value={dateValue}>
        {dateNote}
      </Fact>
      <Fact label="開催形式" value={EVENT_FORMAT_LABEL[detail.format]}>
        {detail.venue && <span className="block">会場: {detail.venue}</span>}
        {detail.meetingUrl ? (
          <span className="block">
            配信URL:{" "}
            <a href={detail.meetingUrl} target="_blank" rel="noopener noreferrer" className="font-bold break-all underline decoration-accent-strong decoration-2 underline-offset-2">
              {detail.meetingUrl}
            </a>
          </span>
        ) : urlPending ? (
          <span className="block">
            配信URLは{detail.status === "CONFIRMED" ? "回答した人にのみ表示されます" : "開催日決定後、回答した人に表示されます"}
          </span>
        ) : detail.format !== "OFFLINE" ? (
          <span className="block">配信URLは未設定です</span>
        ) : null}
      </Fact>
      <Fact label="参加状況" value={`回答 ${detail.responders.length}人・登壇 ${speakers}人`}>
        聴講 {audience}人
      </Fact>
    </dl>
  );
}

/**
 * 候補日ごとの ○△× を横棒で見せる。棒の長さは回答者全体に対する割合（未回答の分は空ける）。
 * 棒は飾りで、数は文字でも出す
 */
export function ResponseBars({ detail }: { detail: EventDetailDto }) {
  const total = detail.responders.length || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <ul className="space-y-4">
      {detail.tallies.map((t) => {
        const confirmed = detail.confirmedDate?.id === t.eventDate.id;
        return (
          <li key={t.eventDate.id} className="grid items-center gap-x-5 gap-y-1.5 sm:grid-cols-[12rem_minmax(0,1fr)_7rem]">
            <span className="font-display font-black">
              {formatDateRange(t.eventDate.startsAt, t.eventDate.endsAt)}
              {confirmed && <span className="badge ml-2 bg-success-bg text-success-foreground">開催日</span>}
            </span>
            <span aria-hidden="true" className="flex h-3 gap-[3px] rounded-full bg-muted">
              {t.yes > 0 && <span className="rounded-full bg-success" style={{ width: pct(t.yes) }} />}
              {t.maybe > 0 && <span className="rounded-full bg-primary" style={{ width: pct(t.maybe) }} />}
              {t.no > 0 && <span className="rounded-full bg-danger" style={{ width: pct(t.no) }} />}
            </span>
            <span className="font-display text-sm font-bold whitespace-nowrap">
              <span className="text-success-foreground">○{t.yes}</span>{" "}
              <span className="text-warning-foreground">△{t.maybe}</span>{" "}
              <span className="text-danger-foreground">×{t.no}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
