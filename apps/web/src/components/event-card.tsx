import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import { EventStatusBadge } from "./event-status-badge";

export function EventCard({ event }: { event: EventSummaryDto }) {
  return (
    // カード全体のリンクを背景として敷く(stretched link)
    <div className="card relative block transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)]">

      <Link href={`/events/${event.id}`} className="absolute inset-0" aria-label={event.title} />

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

      <p className="mt-2 text-xs text-subtle">
        主催: {" "}
        {/* relative + z-10で、背景に敷いたカード全体のリンクより手前に出す */}
          <Link
            href={`/users/${event.organizer.id}`}
            className="relative z-10 underline hover:text-foreground"
          >
            {event.organizer.displayName}
          </Link>
        </p>
    </div>
  );
}
