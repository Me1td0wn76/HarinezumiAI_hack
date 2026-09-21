"use client";

import type { EventDetailDto } from "@lt/shared";
import { useActionState } from "react";
import { confirmEvent, removeDate } from "@/actions/events";
import { formatDateRange } from "@/lib/format";
import { AddDatesForm } from "./add-dates-form";
import { CopyButton } from "./copy-button";
import { FormMessage } from "./form-message";

/** 主催者だけに見せる操作パネル: 共有URL、開催日の決定、候補日の追加・削除 */
export function OrganizerPanel({ detail, shareUrl }: { detail: EventDetailDto; shareUrl: string | null }) {
  const [confirmState, confirmAction, confirming] = useActionState(confirmEvent, undefined);
  const [removeState, removeAction, removing] = useActionState(removeDate, undefined);
  const isOpen = detail.status === "OPEN";

  return (
    <section className="card space-y-5 border-emerald-200">
      <h2 className="font-bold text-emerald-800">主催者メニュー</h2>

      {shareUrl && (
        <div>
          <p className="label">共有URL（ログインなしで回答できます）</p>
          <div className="flex gap-2">
            <input className="input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
            <CopyButton text={shareUrl} />
          </div>
          <p className="mt-1 text-xs text-stone-500">Discord や LINE に貼って参加者に回答してもらいましょう。</p>
        </div>
      )}

      {isOpen ? (
        <div>
          <p className="label">開催日を決める</p>
          <ul className="divide-y divide-stone-100">
            {detail.tallies.map((t) => (
              <li key={t.eventDate.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="w-44">{formatDateRange(t.eventDate.startsAt, t.eventDate.endsAt)}</span>
                <span className="text-stone-500">
                  ○{t.yes} △{t.maybe} ×{t.no}
                </span>
                <form action={confirmAction} className="ml-auto flex gap-2">
                  <input type="hidden" name="eventId" value={detail.id} />
                  <input type="hidden" name="eventDateId" value={t.eventDate.id} />
                  <button type="submit" className="btn-primary" disabled={confirming}>
                    この日に決定
                  </button>
                </form>
                <form action={removeAction}>
                  <input type="hidden" name="eventId" value={detail.id} />
                  <input type="hidden" name="eventDateId" value={t.eventDate.id} />
                  <button
                    type="submit"
                    className="btn-danger"
                    disabled={removing || detail.candidateDates.length <= 1}
                    title={detail.candidateDates.length <= 1 ? "候補日は1つ以上必要です" : undefined}
                  >
                    削除
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <FormMessage state={confirmState} />
          <FormMessage state={removeState} />
        </div>
      ) : (
        <p className="text-sm text-stone-600">
          開催日は{" "}
          <strong>{detail.confirmedDate && formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)}</strong>{" "}
          に決定済みです。
        </p>
      )}

      {isOpen && (
        <div>
          <p className="label">候補日を追加</p>
          <AddDatesForm eventId={detail.id} />
        </div>
      )}
    </section>
  );
}
