"use client";

import { useEffect } from "react";
import { motionAllowed } from "./click-effects";

/** 傾きの最大角度（度） */
const MAX_TILT = 7;

/**
 * カーソルを乗せたカード（.card-hover）を、カーソルの方向へ立体的に傾け、その位置に光を当てる。
 * カードごとに部品を包まず、ページ全体の pointermove を1か所で見て CSS 変数を書き込む（見た目は globals.css）。
 * マウスのときだけ動かす（タッチでは傾けない）。layout.tsx に1つだけ置く
 */
export function CardTilt() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    let frame = 0;

    function reset(el: HTMLElement) {
      el.removeAttribute("data-tilting");
      for (const v of ["--lt-rx", "--lt-ry", "--lt-mx", "--lt-my"]) el.style.removeProperty(v);
    }

    function onMove(e: PointerEvent) {
      const el = e.pointerType === "mouse" ? ((e.target as Element | null)?.closest?.(".card-hover") as HTMLElement | null) : null;
      if (current && current !== el) {
        reset(current);
        current = null;
      }
      if (!el || !motionAllowed()) return;
      current = el;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        el.style.setProperty("--lt-rx", `${(0.5 - py) * 2 * MAX_TILT}deg`);
        el.style.setProperty("--lt-ry", `${(px - 0.5) * 2 * MAX_TILT}deg`);
        el.style.setProperty("--lt-mx", `${px * 100}%`);
        el.style.setProperty("--lt-my", `${py * 100}%`);
        el.setAttribute("data-tilting", "");
      });
    }

    function onLeave() {
      if (current) reset(current);
      current = null;
    }

    document.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      onLeave();
    };
  }, []);

  return null;
}
