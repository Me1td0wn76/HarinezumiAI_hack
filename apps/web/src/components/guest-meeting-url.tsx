"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { fetchGuestMeetingUrl } from "@/actions/share";

const KEY_STORAGE = "lt:guestKey";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * 共有URL で回答したゲスト向けに配信URL を表示する。
 * ゲストの識別子は localStorage にしかないので、クライアントから Server Function 経由で取りに行く。
 */
export function GuestMeetingUrl({ token }: { token: string }) {
  const guestKey = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY_STORAGE), () => null);
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  if (!guestKey) {
    return <p className="text-muted-foreground">配信URLは回答した人にのみ表示されます。</p>;
  }
  if (url) {
    return (
      <p>
        <span className="text-muted-foreground">配信URL: </span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-secondary-foreground underline">
          {url}
        </a>
      </p>
    );
  }
  if (url === null) {
    return <p className="text-muted-foreground">このブラウザからの回答が見つからないため、配信URLを表示できません。</p>;
  }
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={pending}
      onClick={() => startTransition(async () => setUrl(await fetchGuestMeetingUrl(token, guestKey)))}
    >
      {pending ? "確認中…" : "配信URLを表示する"}
    </button>
  );
}
