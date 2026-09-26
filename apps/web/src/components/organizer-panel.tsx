"use client";

import type { EventDetailDto } from "@lt/shared";
import Link from "next/link";
import { useActionState,useState } from "react";
import { closeEvent, deleteEvent, removeDate } from "@/actions/events";
import { formatDateRange } from "@/lib/format";
import { AddDatesForm } from "./add-dates-form";
import { WebhookForm } from "./webhook-form";
import { FormMessage } from "./form-message";
import { ShareButtons } from "./share-buttons";
import { ConfirmDateDialog } from "./confirm-date-dialog";

/** 主催者だけに見せる操作パネル: 共有URL、開催日の決定、候補日の追加・削除 */
export function OrganizerPanel({ detail, shareUrl }: { detail: EventDetailDto; shareUrl: string | null }) {
  // 確認ダイアログを開いている候補日。null なら閉じている
  const [confirmingDateId, setConfirmingDateId] = useState<string | null>(null);
  const [removeState, removeAction, removing] = useActionState(removeDate, undefined);
  const [closeState, closeAction, closing] = useActionState(closeEvent, undefined);
  const [deleteState, deleteAction, deleting] = useActionState(deleteEvent, undefined);
  const isOpen = detail.status === "OPEN";
  const isClosed = detail.status === "CLOSED";
  // 候補日ごとの○△×棒グラフの分母。0除算を避けるため未回答時は1として扱う
  const totalResponders = detail.responders.length || 1;

  const confirmingTally = confirmingDateId
    ? detail.tallies.find((t) => t.eventDate.id === confirmingDateId)
    : undefined;

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
          <input className="input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label="共有URL" />
          <p className="mt-1.5 text-xs text-muted-foreground">Discord や LINE に貼って参加者に回答してもらいましょう。</p>
          <div className="mt-2">
            <ShareButtons url={shareUrl} text={`「${detail.title}」参加できる日を回答してください`} compact />
          </div>
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
                  {/* 決定すると通知が飛び回答も締め切られるので、ここでは送信せず確認ダイアログを開く */}
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    aria-haspopup="dialog"
                    onClick={() => setConfirmingDateId(t.eventDate.id)}
                  >
                    この日に決定  
                  </button>
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
          <FormMessage state={removeState} />
          {confirmingTally ? (
            <ConfirmDateDialog
              key={confirmingTally.eventDate.id}
              eventId={detail.id}  
              tally={confirmingTally}
              totalResponders={detail.responders.length}
              hasMeetingUrl={Boolean(detail.meetingUrl)}
              onClose={() => setConfirmingDateId(null)}
            />
          ) : null}
        </div>
      ) : isClosed ? (
        <div className="rounded-[1.25rem] border-[1.5px] border-card-border bg-muted p-4 text-sm text-muted-foreground">
          このLT会は終了しました。
        </div>
      ) : detail.confirmedDate ? (
        <div className="rounded-[1.25rem] border-[1.5px] border-success bg-success-bg p-4 text-sm text-success-foreground">
          🎉 開催日は{" "}
          <strong className="font-display">
            {formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)}
          </strong>{" "}
          に決定済みです。
        </div>
      ) : null}

      {isOpen && (
        <div>
          <p className="label">候補日を追加</p>
          <AddDatesForm eventId={detail.id} />
        </div>
      )}

      <div>
        <p className="label">Discord への通知</p>
        <WebhookForm eventId={detail.id} webhookUrl={detail.webhookUrl} />
      </div>

      <div className="border-t border-card-border pt-4">
        <p className="label">LT会の管理</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/events/${detail.id}/edit`} className="btn-secondary text-xs">
            タイトル・内容を編集
          </Link>
          {!isClosed && (
            <form
              action={closeAction}
              onSubmit={(e) => {
                // 終了は取り消せないため、押し間違いに備えて確認する。回答を受け付けているのは OPEN の間だけ
                const warning = isOpen ? "終了すると参加者は回答できなくなり、元に戻せません。" : "終了すると元に戻せません。";
                if (!window.confirm(`このLT会を終了にしますか？\n${warning}`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="eventId" value={detail.id} />
              <button type="submit" className="btn-secondary text-xs" disabled={closing}>
                {closing ? "処理中…" : "終了にする"}
              </button>
            </form>
          )}
          <form
            action={deleteAction}
            onSubmit={(e) => {
              // 回答もすべて消えるため、送信前に確認する
              if (!window.confirm(`「${detail.title}」を削除します。回答もすべて削除され、元に戻せません。よろしいですか？`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="eventId" value={detail.id} />
            <button type="submit" className="btn-danger text-xs" disabled={deleting}>
              {deleting ? "削除中…" : "LT会を削除"}
            </button>
          </form>
        </div>
        {!isClosed && (
          <p className="mt-1.5 text-xs text-muted-foreground">開催が終わった・中止になったLT会は終了にできます。</p>
        )}
        <FormMessage state={closeState} />
        <FormMessage state={deleteState} />
      </div>
    </section>
  );
}
