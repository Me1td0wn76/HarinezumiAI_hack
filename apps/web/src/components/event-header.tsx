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
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">{title}</h1>
        <EventStatusBadge status={status} />
      </div>
      <p className="flex items-center gap-1 text-sm text-subtle">
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
        <div className="flex items-center gap-3 rounded-[1.25rem] border-[1.5px] border-success bg-success-bg px-4 py-3">
          <span className="text-2xl">📅</span>
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
