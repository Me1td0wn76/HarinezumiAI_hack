"use client";

import { useActionState } from "react";
import { confirmPasswordReset } from "@/actions/password-reset";
import { FormMessage } from "./form-message";

export function PasswordResetConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmPasswordReset, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">
          新しいパスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="label" htmlFor="passwordConfirm">
          新しいパスワード（確認）
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          className="input"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />
      </div>
      <FormMessage state={state} />
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "設定中…" : "パスワードを設定する"}
      </button>
    </form>
  );
}
