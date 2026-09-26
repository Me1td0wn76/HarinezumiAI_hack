"use client";

import { useEffect, useId, useState } from "react";
import { useEffectsEnabled } from "./click-effects";

const BOLT = "M13 2 4 14h7l-1 8 9-12h-7l1-8z";

/**
 * ページ上部の黄色い帯に置く飾りの図形（白い円と稲妻）。マウスの位置に合わせてゆっくり動く。
 * 飾りなので読み上げ対象から外し、クリックも受け取らない。
 * 演出 OFF のときは動かさない（「動きを減らす」設定では CSS の .lt-shape が止める）
 * @param size 図形の大きさ（HOME は大きく、各ページの帯は小さく）
 * @param charge 「LT会を作る」用。0〜1 を渡すと稲妻が下からその割合だけオレンジに満ち、1 で光る（入力の進み具合）
 * @param chargeLabel 稲妻の下に出す短い文字（「充電 1/3」など）
 */
export function HeroShapes({
  size = "large",
  charge,
  chargeLabel,
}: {
  size?: "large" | "small";
  charge?: number;
  chargeLabel?: string;
}) {
  const enabled = useEffectsEnabled();
  // useId の値には記号が入るので、url(#...) で参照できる文字だけにする
  const clipId = `lt-charge${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(frame);
      // 画面中央からのずれ（-1〜1）。1 フレームに 1 回だけ反映する
      frame = requestAnimationFrame(() =>
        setOffset({
          x: (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2),
          y: (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2),
        }),
      );
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  const o = enabled ? offset : { x: 0, y: 0 };
  const large = size === "large";
  const charging = charge !== undefined;
  const level = Math.min(1, Math.max(0, charge ?? 0));
  const full = level >= 1;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 200 200"
        className={`lt-shape absolute ${large ? "-right-20 top-16 h-[38rem] w-[38rem]" : "-right-16 -top-16 h-[26rem] w-[26rem]"}`}
        style={{ transform: `translate(${o.x * -24}px, ${o.y * -18}px)` }}
      >
        <circle cx="100" cy="100" r="96" fill="#ffffff" opacity="0.7" />
      </svg>
      <div
        className={`lt-shape absolute hidden md:block ${large ? "right-24 top-56 h-80 w-80" : "right-32 top-6 h-44 w-44"}`}
        // 各ページの帯は高さが低いので、上下の動きを小さくして、稲妻が帯の上下で切れないようにする
        style={{ transform: `translate(${o.x * 36}px, ${o.y * (large ? 28 : 16)}px) rotate(${o.x * 6}deg)` }}
      >
        <svg viewBox="0 0 24 24" className={`h-full w-full overflow-visible ${charging && full ? "lt-charged" : ""}`}>
          {charging && (
            <defs>
              <clipPath id={clipId}>
                {/* 満ちた分だけ下から見せる。translateY は SVG の座標（0〜24）で効く */}
                <rect className="lt-charge" x="0" y="0" width="24" height="24" style={{ transform: `translateY(${24 * (1 - level)}px)` }} />
              </clipPath>
            </defs>
          )}
          <path d={BOLT} fill={charging ? "#fff3e0" : "#ffb86b"} stroke="#e07a1f" strokeWidth="0.5" strokeLinejoin="round" />
          {charging && <path d={BOLT} fill="#ff9f43" clipPath={`url(#${clipId})`} />}
          {charging && full && (
            <g stroke="#e07a1f" strokeWidth="0.8" strokeLinecap="round">
              <path className="lt-spark" d="M20 3l2-1.5" />
              <path className="lt-spark" d="M3 8l-2-.5" style={{ animationDelay: ".3s" }} />
              <path className="lt-spark" d="M20 18l2 1" style={{ animationDelay: ".6s" }} />
              <path className="lt-spark" d="M6 21l-1.5 1.5" style={{ animationDelay: ".15s" }} />
            </g>
          )}
        </svg>
        {chargeLabel && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 font-display text-xs font-black whitespace-nowrap">
            {chargeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
