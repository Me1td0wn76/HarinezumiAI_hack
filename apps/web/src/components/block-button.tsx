"use client";

import { useActionState } from "react";
import { setBlocked } from "@/actions/moderation";
import { FormMessage } from "./form-message";

/** ユーザーのブロック / 解除。ブロックするとその人が主催するLT会が一覧に出なくなる */
export function BlockButton({ userId, displayName, blocked }: { userId: string; displayName: string; blocked: boolean }) {
  const [state, action, pending] = useActionState(setBlocked, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!blocked && !window.confirm(`${displayName} さんをブロックしますか？この人が主催するLT会が一覧に表示されなくなります。`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="block" value={String(!blocked)} />
      <button type="submit" className={blocked ? "btn-secondary text-xs" : "btn-danger text-xs"} disabled={pending}>
        {pending ? "処理中…" : blocked ? `${displayName} さんのブロックを解除` : `${displayName} さんをブロック`}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
