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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reveal(key: string) {
    startTransition(async () => {
      try {
        const result = await fetchGuestMeetingUrl(token, key);
        if ("error" in result) {
          setError(`配信URLを取得できませんでした（${result.error}）`);
          return;
        }
        setError(null);
        setUrl(result.meetingUrl);
      } catch {
        // Server Function 自体に届かなかった（通信断など）
        setError("配信URLを取得できませんでした。時間をおいてもう一度お試しください");
      }
    });
  }

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
    <div className="space-y-2">
      <button type="button" className="btn-secondary" disabled={pending} onClick={() => reveal(guestKey)}>
        {pending ? "確認中…" : "配信URLを表示する"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-danger-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
