import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import { EventStatusBadge } from "./event-status-badge";

export function EventCard({ event }: { event: EventSummaryDto }) {
  return (
    <Link href={`/events/${event.id}`} className="card block transition hover:border-emerald-300 hover:shadow">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="font-bold">{event.title}</h2>
        <EventStatusBadge status={event.status} />
      </div>
      <p className="text-sm text-stone-600">
        {event.confirmedDate
          ? `📅 ${formatDateRange(event.confirmedDate.startsAt, event.confirmedDate.endsAt)}`
          : `候補日 ${event.candidateDateCount} 件 / 回答 ${event.responderCount} 人`}
      </p>
      <p className="mt-1 text-xs text-stone-400">主催: {event.organizer.displayName}</p>
    </Link>
  );
}
