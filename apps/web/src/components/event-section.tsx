import type { EventSummaryDto } from "@lt/shared";
import { EventCard } from "./event-card";

/** 見出し・件数付きのLT会カード一覧。/me の履歴と公開プロフィールで使う */
export function EventSection({
  title,
  events,
  empty,
}: {
  title: string;
  events: EventSummaryDto[];
  empty: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-extrabold text-foreground">{title}</h2>
        <span className="badge bg-secondary text-secondary-foreground">{events.length} 件</span>
      </div>
      {events.length === 0 ? (
        <p className="card text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}
