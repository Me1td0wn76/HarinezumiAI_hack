import type { EventDetailDto } from "@lt/shared";
import { formatDateRange } from "@/lib/format";
import { EventStatusBadge } from "./event-status-badge";
import { OrganizationLink } from "./organization-link";
import { TagChip } from "./tag-chip";
import { UserLink } from "./user-link";

/**
 * イベント詳細ページ（events/[id]）と共有ページ（share/[token]）で共通のヘッダー。
 * タイトル・ステータスバッジ・主催者名・タグ・確定日バナーを表示する。
 * 元は各ページに同じJSXが10行ずつコピーされていたため、ここに切り出した。
 */
export function EventHeader({
  title,
  status,
  organizer,
  confirmedDate,
  tags = [],
  organization = null,
}: Pick<EventDetailDto, "title" | "status" | "organizer" | "confirmedDate"> &
  Partial<Pick<EventDetailDto, "tags" | "organization">>) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl leading-tight font-black tracking-tight text-foreground sm:text-5xl">{title}</h1>
        <EventStatusBadge status={status} />
      </div>
      <p className="flex items-center gap-1 text-sm font-bold text-foreground/80">
        <span className="shrink-0">主催:</span>
        <UserLink user={organizer} />
        {organization ? (
          <>
            <span className="mx-1" aria-hidden="true">
              ・
            </span>
            <OrganizationLink organization={organization} />
          </>
        ) : null}
      </p>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : null}
      {confirmedDate && (
        <div className="flex max-w-xl items-center gap-3 rounded-2xl border-2 border-success bg-white px-4 py-3">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 shrink-0 text-success-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          <div>
            <div className="mb-0.5 font-display text-xs font-bold text-success-foreground">開催日確定</div>
            <div className="font-display text-base font-extrabold text-foreground">
              {formatDateRange(confirmedDate.startsAt, confirmedDate.endsAt)}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
