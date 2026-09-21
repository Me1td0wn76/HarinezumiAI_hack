"use client";

import type { UserDto } from "@lt/shared";
import { useActionState } from "react";
import { updateProfile } from "@/actions/events";
import { FormMessage } from "./form-message";

export function ProfileForm({ user }: { user: UserDto }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label">メールアドレス</label>
        <p className="text-sm text-stone-600">{user.email}</p>
      </div>
      <div>
        <label className="label" htmlFor="displayName">
          表示名
        </label>
        <input id="displayName" name="displayName" className="input" defaultValue={user.displayName} required maxLength={50} />
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
