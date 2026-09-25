"use client";

import type { UserDto } from "@lt/shared";
import Link from "next/link";
import { useActionState } from "react";
import { updateProfile } from "@/actions/events";
import { FormMessage } from "./form-message";
import { HandleField } from "./handle-field";
import { keepValuesOnSubmit } from "@/lib/keep-values-on-submit";

export function ProfileForm({ user }: { user: UserDto }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    // ハンドルが使用済みで弾かれても、書きかけの自己紹介などが元に戻らないよう入力を残す
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="card space-y-4">
      <p className="text-right text-xs">
        <Link href={`/users/${user.handle}`} className="font-semibold text-secondary-foreground underline">
          公開プロフィールを見る
        </Link>
      </p>
      <div>
        <label className="label">メールアドレス</label>
        <p className="text-sm text-muted-foreground">{user.email}（ほかの人には表示されません）</p>
      </div>
      <div>
        <label className="label" htmlFor="displayName">
          表示名
        </label>
        <input id="displayName" name="displayName" className="input" defaultValue={user.displayName} required maxLength={50} />
      </div>
      <HandleField defaultValue={user.handle} />
      <div>
        <label className="label" htmlFor="avatarUrl">
          アバター画像の URL（任意）
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          inputMode="url"
          autoComplete="off"
          className="input"
          defaultValue={user.avatarUrl ?? ""}
          maxLength={2048}
          pattern="https://.*"
          placeholder="https://…"
          aria-describedby="avatarUrl-hint"
        />
        <p id="avatarUrl-hint" className="mt-1 text-xs text-subtle">
          https の画像 URL。空欄ならハンドルから自動で作った画像を表示します
        </p>
      </div>
      <div>
        <label className="label" htmlFor="bio">
          自己紹介
        </label>
        <textarea id="bio" name="bio" className="input" rows={3} defaultValue={user.bio ?? ""} maxLength={500} />
      </div>
      <FormMessage state={state} successText="保存しました" />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
