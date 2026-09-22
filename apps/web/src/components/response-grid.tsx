import { AVAILABILITY_LABEL, type Availability, type EventDetailDto } from "@lt/shared";
import { formatDateRange } from "@/lib/format";

/** グリッド表の各セルに表示する○△×バッジの配色。Availability の値ごとに切り替える */
const cellStyle: Record<Availability, string> = {
  YES: "bg-success-bg text-success-foreground",
  MAYBE: "bg-warning-bg text-warning-foreground",
  NO: "bg-danger-bg text-danger-foreground",
};

/**
 * 候補日 × 回答者 のグリッド表。集計行を先頭に置く。
 * @param highlightKey 自分の行を強調表示するための responderKey
 */
export function ResponseGrid({ detail, highlightKey }: { detail: EventDetailDto; highlightKey?: string | null }) {
  const { candidateDates, tallies, responders, confirmedDate } = detail;

  if (candidateDates.length === 0) {
    return <p className="text-sm text-muted-foreground">候補日がまだありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card p-2 text-left font-display font-bold text-muted-foreground">参加者</th>
            {candidateDates.map((d) => (
              <th
                key={d.id}
                className={`whitespace-nowrap rounded-t-lg p-2 text-center font-display font-bold ${
                  confirmedDate?.id === d.id ? "bg-success-bg text-success-foreground" : "text-foreground"
                }`}
              >
                {formatDateRange(d.startsAt, d.endsAt)}
                {confirmedDate?.id === d.id && <div className="text-xs">開催日</div>}
              </th>
            ))}
          </tr>
          <tr className="border-y border-card-border bg-muted">
            <th className="sticky left-0 bg-muted p-2 text-left font-display font-bold text-muted-foreground">集計</th>
            {tallies.map((t) => (
              <td key={t.eventDate.id} className="whitespace-nowrap p-2 text-center font-display font-bold">
                <span className="text-success-foreground">○{t.yes}</span>
                <span className="mx-1 text-warning-foreground">△{t.maybe}</span>
                <span className="text-danger-foreground">×{t.no}</span>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {responders.length === 0 && (
            <tr>
              <td colSpan={candidateDates.length + 1} className="p-4 text-center text-subtle">
                まだ回答がありません
              </td>
            </tr>
          )}
          {responders.map((r) => {
            const mine = r.responderKey === highlightKey;
            return (
              <tr key={r.responderKey} className={`border-b border-card-border ${mine ? "bg-secondary/50" : ""}`}>
                <th className="sticky left-0 whitespace-nowrap bg-card p-2 text-left font-normal">
                  {r.displayName}
                  {r.isGuest && <span className="ml-1 text-xs text-subtle">(ゲスト)</span>}
                  {mine && <span className="ml-1 text-xs text-secondary-foreground">(自分)</span>}
                </th>
                {candidateDates.map((d) => {
                  const a = r.answers[d.id];
                  return (
                    <td key={d.id} className="p-1 text-center">
                      {a ? (
                        <span
                          className={`inline-flex w-8 items-center justify-center rounded-full py-1 font-display font-bold ${cellStyle[a.availability]}`}
                          title={a.comment ?? undefined}
                        >
                          {AVAILABILITY_LABEL[a.availability]}
                        </span>
                      ) : (
                        <span className="text-subtle">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
