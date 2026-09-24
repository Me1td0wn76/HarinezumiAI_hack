import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import { EventStatusBadge } from "./event-status-badge";
import { TagChip } from "./tag-chip";

/**
 * 一覧のカード。タグはそれぞれタグページへのリンクなので、カード全体を <Link> で包まず
 * 本文だけをリンクにしている（リンクの入れ子は HTML として不正）
 */
export function EventCard({ event }: { event: EventSummaryDto }) {
  return (
    <article className="card transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)]">
      <Link href={`/events/${event.id}`} className="block">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold leading-snug text-foreground">{event.title}</h2>
          <EventStatusBadge status={event.status} />
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
        <p className="mt-2 text-xs text-subtle">主催: {event.organizer.displayName}</p>
      </Link>
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
