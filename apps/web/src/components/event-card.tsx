import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import { EventFormatBadge } from "./event-format-badge";
import { EventStatusBadge } from "./event-status-badge";

export function EventCard({ event }: { event: EventSummaryDto }) {
  return (
    <article className="card transition hover:border-emerald-300 hover:shadow">
      <Link href={`/events/${event.id}`} className="block">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-bold">{event.title}</h2>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            <EventFormatBadge format={event.format} />
            <EventStatusBadge status={event.status} />
          </div>
        </div>
        <p className="text-sm text-stone-600">
          {event.confirmedDate
            ? `📅 ${formatDateRange(event.confirmedDate.startsAt, event.confirmedDate.endsAt)}`
            : `候補日 ${event.candidateDateCount} 件 / 回答 ${event.responderCount} 人`}
        </p>
        <p className="mt-1 text-xs text-stone-400">主催: {event.organizer.displayName}</p>
      </Link>
      {event.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {event.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="badge bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-800"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
