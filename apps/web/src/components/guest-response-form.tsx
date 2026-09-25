"use client";

import type { EventDateDto, ResponderRowDto } from "@lt/shared";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { submitGuestResponses } from "@/actions/share";
import { guestResponderKey } from "@/lib/guest-key";
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
  // 回答者一覧の自分の行のキー。ハッシュの計算が非同期なので state に持つ
  const [myKey, setMyKey] = useState<{ guestKey: string; responderKey: string } | null>(null);

  useEffect(() => {
    if (!guestKey) return;
    let cancelled = false;
    void guestResponderKey(guestKey).then((responderKey) => {
      if (!cancelled) setMyKey({ guestKey, responderKey });
    });
    return () => {
      cancelled = true;
    };
  }, [guestKey]);

  // 送信に成功したら次回のために名前を覚えておく
  useEffect(() => {
    if (state?.success && nameRef.current) localStorage.setItem(NAME_STORAGE, nameRef.current.value);
  }, [state]);

  // guestKey と自分の行のキーが決まるまで（ハイドレーション完了まで）はフォームを出さない。
  // 先に出すと defaultValue に以前の回答が入らない
  if (!guestKey || myKey?.guestKey !== guestKey) return <p className="text-sm text-subtle">読み込み中…</p>;

  const mine = responders.find((r) => r.responderKey === myKey.responderKey);

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
