"use client";

import type { EventDetailDto } from "@lt/shared";
import { useActionState } from "react";
import { closeEvent, confirmEvent, removeDate } from "@/actions/events";
import { formatDateRange } from "@/lib/format";
import { AddDatesForm } from "./add-dates-form";
import { CopyButton } from "./copy-button";
import { FormMessage } from "./form-message";

/** 主催者だけに見せる操作パネル: 共有URL、開催日の決定、候補日の追加・削除 */
export function OrganizerPanel({ detail, shareUrl }: { detail: EventDetailDto; shareUrl: string | null }) {
  const [confirmState, confirmAction, confirming] = useActionState(confirmEvent, undefined);
  const [removeState, removeAction, removing] = useActionState(removeDate, undefined);
  const [closeState, closeAction, closing] = useActionState(closeEvent, undefined);
  const isOpen = detail.status === "OPEN";
  const isClosed = detail.status === "CLOSED";
  // 候補日ごとの○△×棒グラフの分母。0除算を避けるため未回答時は1として扱う
  const totalResponders = detail.responders.length || 1;

  return (
    <section className="card space-y-6 border-primary">
      <div className="flex items-center gap-2">
        <span className="eyebrow">⚡ ORGANIZER</span>
        <h2 className="font-display font-extrabold text-foreground">主催者メニュー</h2>
      </div>

      {shareUrl && (
        <div className="rounded-[1.25rem] border-[1.5px] border-primary bg-secondary/60 p-4">
          <p className="mb-1.5 font-display text-xs font-bold text-secondary-foreground">
            共有URL（ログインなしで回答できます）
          </p>
          <div className="flex gap-2">
            <input className="input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
            <CopyButton text={shareUrl} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Discord や LINE に貼って参加者に回答してもらいましょう。</p>
        </div>
      )}

      {isOpen ? (
        <div>
          <p className="label">開催日を決める</p>
          {/* ul/li でリストとして組む（div の入れ子だとスクリーンリーダーで項目数・項目単位の移動ができない） */}
          <ul className="divide-y divide-card-border">
            {detail.tallies.map((t) => (
              <li key={t.eventDate.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <div className="font-display text-sm font-bold text-foreground">
                      {formatDateRange(t.eventDate.startsAt, t.eventDate.endsAt)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      <span className="text-success-foreground">○{t.yes}</span>{" "}
                      <span className="text-warning-foreground">△{t.maybe}</span>{" "}
                      <span className="text-danger-foreground">×{t.no}</span>
                    </div>
                  </div>
                  <form action={confirmAction} className="flex gap-2">
                    <input type="hidden" name="eventId" value={detail.id} />
                    <input type="hidden" name="eventDateId" value={t.eventDate.id} />
                    <button type="submit" className="btn-primary text-xs" disabled={confirming}>
                      この日に決定
                    </button>
                  </form>
                  <form action={removeAction}>
                    <input type="hidden" name="eventId" value={detail.id} />
                    <input type="hidden" name="eventDateId" value={t.eventDate.id} />
                    <button
                      type="submit"
                      className="btn-danger text-xs"
                      disabled={removing || detail.candidateDates.length <= 1}
                      title={detail.candidateDates.length <= 1 ? "候補日は1つ以上必要です" : undefined}
                    >
                      削除
                    </button>
                  </form>
                </div>
                {/* ○△×の回答割合を示す帯グラフ。各色の幅は totalResponders に対する割合(%) */}
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                  <div style={{ width: `${(t.yes / totalResponders) * 100}%` }} className="bg-success" />
                  <div style={{ width: `${(t.maybe / totalResponders) * 100}%` }} className="bg-primary" />
                  <div style={{ width: `${(t.no / totalResponders) * 100}%` }} className="bg-danger" />
                </div>
              </li>
            ))}
          </ul>
          <FormMessage state={confirmState} />
          <FormMessage state={removeState} />
        </div>
      ) : detail.confirmedDate ? (
        <div className="rounded-[1.25rem] border-[1.5px] border-success bg-success-bg p-4 text-sm text-success-foreground">
          🎉 開催日は{" "}
          <strong className="font-display">
            {formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)}
          </strong>{" "}
          に決定済みです。
        </div>
      ) : (
        <div className="rounded-[1.25rem] border-[1.5px] border-card-border bg-muted p-4 text-sm text-muted-foreground">
          このLT会は終了しました。
        </div>
      )}

      {isOpen && (
        <div>
          <p className="label">候補日を追加</p>
          <AddDatesForm eventId={detail.id} />
        </div>
      )}

      {!isClosed && (
        <div className="border-t border-card-border pt-4">
          <form action={closeAction} className="flex items-center justify-between gap-3">
            <input type="hidden" name="eventId" value={detail.id} />
            <p className="text-xs text-muted-foreground">開催が終わった・中止になったLT会は終了にできます。</p>
            <button type="submit" className="btn-secondary text-xs" disabled={closing}>
              終了にする
            </button>
          </form>
          <FormMessage state={closeState} />
        </div>
      )}
    </section>
  );
}
