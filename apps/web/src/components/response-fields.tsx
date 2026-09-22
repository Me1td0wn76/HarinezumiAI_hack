import { AVAILABILITY, AVAILABILITY_LABEL, type Availability, type EventDateDto, type ResponderRowDto } from "@lt/shared";
import { formatDateRange } from "@/lib/format";

/** ○△×の丸ボタン（vote-btn）が選択された(peer-checked)ときの配色。Availability の値ごとに切り替える */
const optionStyle: Record<Availability, string> = {
  YES: "peer-checked:border-success peer-checked:bg-success-bg peer-checked:text-success-foreground peer-checked:scale-110",
  MAYBE: "peer-checked:border-primary peer-checked:bg-warning-bg peer-checked:text-warning-foreground peer-checked:scale-110",
  NO: "peer-checked:border-danger peer-checked:bg-danger-bg peer-checked:text-danger-foreground peer-checked:scale-110",
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
    <div className="divide-y divide-card-border">
      {candidateDates.map((d) => {
        const current = initial?.[d.id];
        return (
          <div key={d.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="w-44 shrink-0 font-display text-sm font-bold text-foreground">
              {formatDateRange(d.startsAt, d.endsAt)}
            </div>
            <div className="flex gap-2" role="radiogroup">
              {AVAILABILITY.map((a) => (
                <label key={a} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`availability:${d.id}`}
                    value={a}
                    defaultChecked={current?.availability === a}
                    className="peer sr-only"
                  />
                  {/*
                    border-border-strong: 未選択時の枠線は WCAG 非テキストコントラスト基準(3:1)を満たす濃さにする
                    （border-border は装飾用で薄すぎるため、意味を持つUI部品の境界には使わない）。
                    peer-focus-visible: キーボード操作(Tab)でどの○△×にフォーカスがあるか分かるようにする
                  */}
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-border-strong bg-card font-display text-base font-black text-subtle shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:scale-105 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 ${optionStyle[a]}`}
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
