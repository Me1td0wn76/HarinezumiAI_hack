"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motionAllowed } from "./click-effects";

type Phase = "pre" | "in" | "out";

/** 幕が画面を覆い終わるまで。この後に移動を始め、移動が済んでいても最低これだけは覆っておく */
const COVER_MS = 440;
/** 幕が抜けていく長さ */
const LEAVE_MS = 480;
/** 移動が終わらないときも、ここで幕を引く（通信エラーなどで画面に覆いが残らないようにする） */
const GIVE_UP_MS = 4000;
const FALLBACK_COLOR = "#ffe45c";

/**
 * 移動先と幕の色。演出の対象は data-transition を付けたリンクだけ（HOME の「近日開催のLT会」「どこから始める？」の箱）。
 * 幕の色は data-transition の値、無ければ押した箱の背景色。
 * 別タブ・外部・同じページ内のアンカーなどは対象外（null）
 */
function targetOf(e: MouseEvent): { url: URL; color: string } | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a[href][data-transition]") as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  const bg = getComputedStyle(a).backgroundColor;
  const color = a.dataset.transition || (bg && bg !== "rgba(0, 0, 0, 0)" ? bg : FALLBACK_COLOR);
  return { url, color };
}

/**
 * 画面切り替えの演出。対象の箱を押すと、その箱と同じ色の幕が左から画面をよぎり、覆っているあいだに次の画面へ移る。
 * layout.tsx に1つだけ置く。
 *
 * クリックはキャプチャ段階で preventDefault し、幕が覆ってから router.push で移動する。
 * Next の Link は、リンク側の onClick を呼んだあと defaultPrevented を見て自分の移動をやめるので、onClick の処理はそのまま動く。
 * 演出 OFF・「視差効果を減らす」設定のときは何もしない（普通に移動する）
 */
export function PageTransition() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [color, setColor] = useState(FALLBACK_COLOR);
  const busy = useRef(false);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };

    function onClick(e: MouseEvent) {
      if (busy.current || !motionAllowed()) return;
      const target = targetOf(e);
      if (!target) return;
      e.preventDefault();
      busy.current = true;
      const from = window.location.href;
      const start = performance.now();
      setColor(target.color);
      setPhase("pre");
      // 待機位置を描いてから動かす（同じフレームで変えると、途中の動きが出ない）
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("in")));
      later(COVER_MS, () => router.push(target.url.pathname + target.url.search + target.url.hash));

      const poll = () => {
        const elapsed = performance.now() - start;
        if ((window.location.href !== from && elapsed >= COVER_MS + 60) || elapsed >= GIVE_UP_MS) {
          setPhase("out");
          later(LEAVE_MS, () => {
            setPhase(null);
            busy.current = false;
          });
        } else {
          later(50, poll);
        }
      };
      later(50, poll);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      timers.forEach(clearTimeout);
    };
  }, [router]);

  if (!phase) return null;
  const x = phase === "pre" ? -100 : phase === "in" ? 0 : 100;
  return (
    <div aria-hidden="true" className="lt-transition">
      <div
        className="absolute inset-0"
        style={{ background: color, transform: `translateX(${x}%)`, transition: "transform .42s cubic-bezier(.7,0,.2,1)" }}
      />
    </div>
  );
}
