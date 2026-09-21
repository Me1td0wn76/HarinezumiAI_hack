"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/actions/auth";
import { FormMessage } from "./form-message";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : register, undefined);
  const isLogin = mode === "login";

  return (
    <div className="card mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-bold">{isLogin ? "ログイン" : "新規登録"}</h1>
      <form action={action} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="label" htmlFor="displayName">
              表示名
            </label>
            <input id="displayName" name="displayName" className="input" required maxLength={50} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">
            メールアドレス
          </label>
          <input id="email" name="email" type="email" className="input" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            パスワード{!isLogin && "（8文字以上）"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>
        <FormMessage state={state} />
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "送信中…" : isLogin ? "ログイン" : "登録する"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">
        {isLogin ? (
          <>
            アカウントがない方は <Link href="/register" className="text-emerald-700 underline">新規登録</Link>
          </>
        ) : (
          <>
            登録済みの方は <Link href="/login" className="text-emerald-700 underline">ログイン</Link>
          </>
        )}
      </p>
    </div>
  );
}
