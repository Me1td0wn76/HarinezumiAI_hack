"use client";

import { useActionState } from "react";
import { deleteComment } from "@/actions/comments";
import { FormMessage } from "./form-message";

export function DeleteCommentButton({ eventId, commentId }: { eventId: string; commentId: string }) {
  const [state, action, pending] = useActionState(deleteComment, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("このコメントを削除しますか？")) e.preventDefault();
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="commentId" value={commentId} />
      <button type="submit" className="text-xs text-subtle hover:text-danger-foreground" disabled={pending}>
        {pending ? "削除中…" : "削除"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
