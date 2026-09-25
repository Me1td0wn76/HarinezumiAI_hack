"use client";

import { useActionState } from "react";
import { markAllNotificationsRead } from "@/actions/notifications";
import { FormMessage } from "./form-message";

/** 「すべて既読にする」。失敗しても一覧は消さず、その場にエラーを出す */
export function MarkAllReadButton() {
  const [state, action, pending] = useActionState(markAllNotificationsRead, undefined);

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <button type="submit" className="btn-secondary text-xs" disabled={pending}>
        すべて既読にする
      </button>
      <FormMessage state={state} />
    </form>
  );
}
