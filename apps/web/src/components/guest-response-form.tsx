"use client";

import type { EventDateDto, ResponderRowDto } from "@lt/shared";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { submitGuestResponses } from "@/actions/share";
import { FormMessage } from "./form-message";
import { ResponseFields } from "./response-fields";

const KEY_STORAGE = "lt:guestKey";
const NAME_STORAGE = "lt:guestName";

// localStorage は SSR 時に存在しないので useSyncExternalStore 経由で読む（サーバー側は null / ""）
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readGuestKey(): string {
  let key = localStorage.getItem(KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(KEY_STORAGE, key);
  }
  return key;
}

function readGuestName(): string {
  return localStorage.getItem(NAME_STORAGE) ?? "";
}

/**
 * 共有URL 用の回答フォーム（ログイン不要）。
 * ブラウザごとに生成した guestKey を localStorage に保持し、同じブラウザからなら回答を更新できる。
 */
export function GuestResponseForm({
  token,
  candidateDates,
  responders,
}: {
  token: string;
  candidateDates: EventDateDto[];
  responders: ResponderRowDto[];
}) {
  const [state, action, pending] = useActionState(submitGuestResponses, undefined);
  const guestKey = useSyncExternalStore(subscribe, readGuestKey, () => null);
  const storedName = useSyncExternalStore(subscribe, readGuestName, () => "");
  const nameRef = useRef<HTMLInputElement>(null);

  // 送信に成功したら次回のために名前を覚えておく
  useEffect(() => {
    if (state?.success && nameRef.current) localStorage.setItem(NAME_STORAGE, nameRef.current.value);
  }, [state]);

  // guestKey が決まるまで（ハイドレーション完了まで）はフォームを出さない
  if (!guestKey) return <p className="text-sm text-stone-400">読み込み中…</p>;

  const mine = responders.find((r) => r.responderKey === `guest:${guestKey}`);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="guestKey" value={guestKey} />
      <div>
        <label className="label" htmlFor="guestName">
          名前
        </label>
        <input
          ref={nameRef}
          id="guestName"
          name="guestName"
          className="input max-w-xs"
          required
          maxLength={50}
          defaultValue={mine?.displayName ?? storedName}
        />
      </div>
      <ResponseFields candidateDates={candidateDates} initial={mine?.answers} />
      <FormMessage state={state} successText="回答を保存しました" />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "送信中…" : mine ? "回答を更新する" : "回答する"}
      </button>
    </form>
  );
}
