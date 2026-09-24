"use client";

import { useState, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

/** Web Share API（主にスマホ）が使えるか。SSR 時は false */
function useCanNativeShare() {
  return useSyncExternalStore(
    subscribeNoop,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
}

/**
 * X / LINE / URL コピー / 端末の共有シート。
 * @param url 共有するURL（主催者には回答用の共有URL、一般には詳細URL を渡す）
 * @param text 投稿に添える文
 */
export function ShareButtons({ url, text, compact = false }: { url: string; text: string; compact?: boolean }) {
  const canNativeShare = useCanNativeShare();
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: text, text, url });
    } catch {
      // ユーザーがキャンセルした場合など。何もしない
    }
  }

  const btn = compact ? "btn-secondary px-3 py-1.5 text-xs" : "btn-secondary";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="共有">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <span aria-hidden="true">𝕏</span> Xで共有
      </a>
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        LINEで送る
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? "コピーしました" : "URLをコピー"}
      </button>
      {canNativeShare ? (
        <button type="button" onClick={nativeShare} className={btn}>
          共有…
        </button>
      ) : null}
    </div>
  );
}
