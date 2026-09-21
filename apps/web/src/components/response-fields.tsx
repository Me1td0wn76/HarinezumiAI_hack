import { AVAILABILITY, AVAILABILITY_LABEL, type Availability, type EventDateDto, type ResponderRowDto } from "@lt/shared";
import { formatDateRange } from "@/lib/format";

const optionStyle: Record<Availability, string> = {
  YES: "peer-checked:bg-emerald-600 peer-checked:text-white",
  MAYBE: "peer-checked:bg-amber-500 peer-checked:text-white",
  NO: "peer-checked:bg-stone-500 peer-checked:text-white",
};

/**
 * 候補日ごとの ○△× とコメントの入力欄。
 * name は availability:<dateId> / comment:<dateId>（actions/form.ts の parseResponses と対応）
 */
export function ResponseFields({
  candidateDates,
  initial,
}: {
  candidateDates: EventDateDto[];
  initial?: ResponderRowDto["answers"];
}) {
  return (
    <div className="divide-y divide-stone-100">
      {candidateDates.map((d) => {
        const current = initial?.[d.id];
        return (
          <div key={d.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="w-44 shrink-0 text-sm font-medium">{formatDateRange(d.startsAt, d.endsAt)}</div>
            <div className="flex gap-1" role="radiogroup">
              {AVAILABILITY.map((a) => (
                <label key={a} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`availability:${d.id}`}
                    value={a}
                    defaultChecked={current?.availability === a}
                    className="peer sr-only"
                  />
                  <span
                    className={`inline-block w-10 rounded-lg border border-stone-300 py-1 text-center font-bold text-stone-500 ${optionStyle[a]}`}
                  >
                    {AVAILABILITY_LABEL[a]}
                  </span>
                </label>
              ))}
            </div>
            <input
              name={`comment:${d.id}`}
              className="input min-w-40 flex-1"
              placeholder="コメント（任意）"
              maxLength={200}
              defaultValue={current?.comment ?? ""}
            />
          </div>
        );
      })}
    </div>
  );
}
