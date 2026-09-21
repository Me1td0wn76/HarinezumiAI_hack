"use client";

import type { EventDateDto, ResponderRowDto } from "@lt/shared";
import { useActionState, useEffect, useState } from "react";
import { submitGuestResponses } from "@/actions/share";
import { FormMessage } from "./form-message";
import { ResponseFields } from "./response-fields";

const KEY_STORAGE = "lt:guestKey";
const NAME_STORAGE = "lt:guestName";

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
  const [guestKey, setGuestKey] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");

  // localStorage は SSR 時に触れないので、マウント後に読む
  useEffect(() => {
    let key = localStorage.getItem(KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(KEY_STORAGE, key);
    }
    setGuestKey(key);
    setGuestName(localStorage.getItem(NAME_STORAGE) ?? "");
  }, []);

  useEffect(() => {
    if (state?.success) localStorage.setItem(NAME_STORAGE, guestName);
  }, [state, guestName]);

  const mine = guestKey ? responders.find((r) => r.responderKey === `guest:${guestKey}`) : undefined;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="guestKey" value={guestKey ?? ""} />
      <div>
        <label className="label" htmlFor="guestName">
          名前
        </label>
        <input
          id="guestName"
          name="guestName"
          className="input max-w-xs"
          required
          maxLength={50}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
      </div>
      {/* guestKey が決まってから描画しないと、自分の前回回答を初期値にできない */}
      {guestKey && <ResponseFields key={mine ? "mine" : "new"} candidateDates={candidateDates} initial={mine?.answers} />}
      <FormMessage state={state} successText="回答を保存しました" />
      <button type="submit" className="btn-primary" disabled={pending || !guestKey}>
        {pending ? "送信中…" : mine ? "回答を更新する" : "回答する"}
      </button>
    </form>
  );
}
