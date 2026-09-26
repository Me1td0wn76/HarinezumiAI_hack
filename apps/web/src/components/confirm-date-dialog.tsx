"use client";

import type { DateTallyDto } from "@lt/shared";
import { useActionState } from "react";
import { confirmEvent } from "@/actions/events";
import { formatDateRange } from "@/lib/format";
import { ConfirmDialog } from "./confirm-dialog";
import { FormMessage } from "./form-message";

/**
 * 開催日を決定する前の確認。決定すると回答者と Discord に通知が飛び、候補日への回答も締め切られるため、
 * ワンクリックで確定しないよう、日時と集計・決定後に起きることを見せてから送信する。
 *
 * 成功すると LT会が CONFIRMED になり、親（OrganizerPanel）の候補日一覧ごとこのダイアログも消える。
 * 失敗したときはダイアログを開いたままエラーを表示する。
 */
export function ConfirmDateDialog({
  eventId,
  tally,
  totalResponders,
  hasMeetingUrl,
  onClose,
}: {
  eventId: string;
  tally: DateTallyDto;
  totalResponders: number;
  /** 配信URLが設定されているか。決定後に回答者へ公開されることを伝える */
  hasMeetingUrl: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(confirmEvent, undefined);
  const noAnswer = Math.max(totalResponders - tally.yes - tally.maybe - tally.no, 0);

  return (
    <ConfirmDialog
      title="この日に開催を決定しますか？"
      action={action}
      pending={pending}
      confirmLabel="この日に決定"
      pendingLabel="決定中…"
      onClose={onClose}
      hiddenFields={
        <>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="eventDateId" value={tally.eventDate.id} />
        </>
      }
    >
      <div className="rounded-[1.25rem] border-[1.5px] border-primary bg-secondary/60 p-4">
        <p className="font-display text-base font-extrabold text-foreground">
          {formatDateRange(tally.eventDate.startsAt, tally.eventDate.endsAt)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="text-success-foreground">○{tally.yes}</span>{" "}
          <span className="text-warning-foreground">△{tally.maybe}</span>{" "}
          <span className="text-danger-foreground">×{tally.no}</span>
          {noAnswer > 0 && <span> ・未回答 {noAnswer}</span>}
          <span>（回答 {totalResponders} 人）</span>
        </p>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>回答した参加者にアプリ内通知が届き、Discord 通知を設定していれば Discord にも投稿されます。</li>
        <li>候補日への回答の受け付けを締め切ります。</li>
        {hasMeetingUrl ? <li>配信URLが、回答・参加表明した人に表示されるようになります。</li> : null}
        <li>決定した後は、この画面から別の候補日に変更できません。</li>
      </ul>
      <FormMessage state={state} />
    </ConfirmDialog>
  );
}