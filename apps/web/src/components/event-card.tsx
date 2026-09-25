import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import { EventFormatBadge } from "./event-format-badge";
import { EventStatusBadge } from "./event-status-badge";
import { TagChip } from "./tag-chip";
import { UserLink } from "./user-link";

/**
 * 一覧のカード。主催者はプロフィールへ、タグはタグページへのリンクなので、カード全体を <Link> で包まず
 * 本文だけをリンクにしている（リンクの入れ子は HTML として不正）
 */
export function EventCard({ event }: { event: EventSummaryDto }) {
  return (
    <article className="card transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)]">
      <Link href={`/events/${event.id}`} className="block">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold leading-snug text-foreground">{event.title}</h2>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            <EventFormatBadge format={event.format} />
            <EventStatusBadge status={event.status} />
          </div>
        </div>
        {/* 開催日が決まっていれば緑のボックスで日時を、未定なら黄色のボックスで候補日数・回答者数を出す */}
        <div
          className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
            event.confirmedDate ? "bg-success-bg text-success-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {event.confirmedDate
            ? `📅 開催日：${formatDateRange(event.confirmedDate.startsAt, event.confirmedDate.endsAt)}`
            : `候補日 ${event.candidateDateCount} 件 / 回答 ${event.responderCount} 人`}
        </div>
      </Link>
      <p className="mt-2 flex items-center gap-1 text-xs text-subtle">
        <span className="shrink-0">主催:</span>
        <UserLink user={event.organizer} />
      </p>
      {event.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
