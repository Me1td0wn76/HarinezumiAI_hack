"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/actions/password-reset";
import { FormMessage } from "./form-message";

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          登録したメールアドレス
        </label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      <FormMessage
        state={state}
        successText="登録されているメールアドレスであれば、再設定用のリンクを送りました。30分以内に開いてください。"
      />
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "送信中…" : "再設定用のリンクを送る"}
      </button>
    </form>
  );
}
