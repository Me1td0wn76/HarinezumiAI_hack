import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import { EventFormatBadge } from "./event-format-badge";
import { EventStatusBadge } from "./event-status-badge";
import { OrganizationLink } from "./organization-link";
import { TagChip } from "./tag-chip";
import { UserLink } from "./user-link";

/**
 * 一覧のカード。主催者はプロフィールへ、タグはタグページへのリンクなので、カード全体を <Link> で包まず
 * 本文だけをリンクにしている（リンクの入れ子は HTML として不正）
 */
export function EventCard({ event }: { event: EventSummaryDto }) {
  return (
    <article className="card card-hover flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <EventStatusBadge status={event.status} />
        <EventFormatBadge format={event.format} />
      </div>
      <Link href={`/events/${event.id}`} className="group block rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-foreground">
        <h2 className="font-display text-xl font-black leading-snug text-foreground group-hover:underline group-hover:decoration-accent group-hover:decoration-2 group-hover:underline-offset-4">
          {event.title}
        </h2>
        <p className="mt-2 text-sm font-bold text-accent-strong">
          {event.confirmedDate
            ? `開催日: ${formatDateRange(event.confirmedDate.startsAt, event.confirmedDate.endsAt)}`
            : `候補日 ${event.candidateDateCount} 件で日程調整中`}
        </p>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-card-border pt-3 text-sm">
        <p className="flex min-w-0 flex-wrap items-center gap-1 text-muted-foreground">
          <span className="shrink-0">主催:</span>
          <UserLink user={event.organizer} />
          {event.organization ? (
            <>
              <span className="mx-1" aria-hidden="true">
                ・
              </span>
              <OrganizationLink organization={event.organization} />
            </>
          ) : null}
        </p>
        <span className="font-bold text-muted-foreground">回答 {event.responderCount} 人</span>
      </div>
      {event.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
