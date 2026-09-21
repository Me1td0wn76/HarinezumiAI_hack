import { AVAILABILITY_LABEL, type Availability, type EventDetailDto } from "@lt/shared";
import { formatDateRange } from "@/lib/format";

const cellStyle: Record<Availability, string> = {
  YES: "bg-emerald-50 text-emerald-700",
  MAYBE: "bg-amber-50 text-amber-700",
  NO: "bg-stone-100 text-stone-400",
};

/**
 * 候補日 × 回答者 のグリッド表。集計行を先頭に置く。
 * @param highlightKey 自分の行を強調表示するための responderKey
 */
export function ResponseGrid({ detail, highlightKey }: { detail: EventDetailDto; highlightKey?: string | null }) {
  const { candidateDates, tallies, responders, confirmedDate } = detail;

  if (candidateDates.length === 0) {
    return <p className="text-sm text-stone-500">候補日がまだありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white p-2 text-left font-medium text-stone-500">参加者</th>
            {candidateDates.map((d) => (
              <th
                key={d.id}
                className={`whitespace-nowrap p-2 text-center font-medium ${
                  confirmedDate?.id === d.id ? "bg-emerald-100 text-emerald-800" : "text-stone-700"
                }`}
              >
                {formatDateRange(d.startsAt, d.endsAt)}
                {confirmedDate?.id === d.id && <div className="text-xs">開催日</div>}
              </th>
            ))}
          </tr>
          <tr className="border-y border-stone-200 bg-stone-50">
            <th className="sticky left-0 bg-stone-50 p-2 text-left font-medium text-stone-500">集計</th>
            {tallies.map((t) => (
              <td key={t.eventDate.id} className="whitespace-nowrap p-2 text-center">
                <span className="font-semibold text-emerald-700">○{t.yes}</span>
                <span className="mx-1 text-amber-700">△{t.maybe}</span>
                <span className="text-stone-400">×{t.no}</span>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {responders.length === 0 && (
            <tr>
              <td colSpan={candidateDates.length + 1} className="p-4 text-center text-stone-400">
                まだ回答がありません
              </td>
            </tr>
          )}
          {responders.map((r) => {
            const mine = r.responderKey === highlightKey;
            return (
              <tr key={r.responderKey} className={`border-b border-stone-100 ${mine ? "bg-emerald-50/40" : ""}`}>
                <th className="sticky left-0 whitespace-nowrap bg-white p-2 text-left font-normal">
                  {r.displayName}
                  {r.isGuest && <span className="ml-1 text-xs text-stone-400">(ゲスト)</span>}
                  {mine && <span className="ml-1 text-xs text-emerald-600">(自分)</span>}
                </th>
                {candidateDates.map((d) => {
                  const a = r.answers[d.id];
                  return (
                    <td key={d.id} className="p-1 text-center">
                      {a ? (
                        <span
                          className={`inline-block w-8 rounded py-1 font-bold ${cellStyle[a.availability]}`}
                          title={a.comment ?? undefined}
                        >
                          {AVAILABILITY_LABEL[a.availability]}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
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
