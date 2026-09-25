"use client";

import { useActionState, useId } from "react";
import { postComment } from "@/actions/comments";
import { FormMessage } from "./form-message";

export function CommentForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(postComment, undefined);
  const bodyId = useId();

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="label" htmlFor={bodyId}>
        コメントを書く
      </label>
      <textarea
        id={bodyId}
        name="body"
        // フォーム action は完了後に defaultValue へリセットされるので、失敗時は入力した本文を戻す
        defaultValue={state?.body}
        className="input"
        rows={3}
        required
        maxLength={1000}
        placeholder="質問や連絡事項など"
      />
      <FormMessage state={state} />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "送信中…" : "コメントする"}
      </button>
    </form>
  );
}
