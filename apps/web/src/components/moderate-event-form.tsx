"use client";

import { useActionState, useId } from "react";
import { moderateEvent } from "@/actions/moderation";
import { FormMessage } from "./form-message";

/** 運営画面: LT会の非表示 / 再表示。理由はログに残る */
export function ModerateEventForm({ eventId, hidden }: { eventId: string; hidden: boolean }) {
  const [state, action, pending] = useActionState(moderateEvent, undefined);
  const id = useId();

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="hidden" value={String(!hidden)} />
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor={`${id}-note`}>
          操作の理由（ログに残ります）
        </label>
        <input id={`${id}-note`} name="note" className="input" maxLength={1000} />
      </div>
      <button type="submit" className={hidden ? "btn-secondary text-xs" : "btn-danger text-xs"} disabled={pending}>
        {pending ? "処理中…" : hidden ? "再表示する" : "非表示にする"}
      </button>
      <div className="basis-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
