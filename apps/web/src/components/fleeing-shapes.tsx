"use client";

import { useEffect, useRef } from "react";
import { motionAllowed } from "./click-effects";
import { LT_ICONS, type LtIconName } from "./lt-icons";

/** カーソルがこの距離（px）より近づくと逃げる。逃げる強さ（近いほど遠くへ） */
const MOTION = {
  large: { reach: 240, push: 0.5 },
  // フォームの見出しの横に置く小さいもの。入力欄に大きくかぶらないよう、控えめに動かす
  small: { reach: 150, push: 0.3 },
} as const;

/**
 * 見出しの横に置く LT会にちなんだアイコン（見出しの内容に合わせて 3 つ選ぶ）。
 * カーソルが近づくと、くるっと 1 回転しながらよけて、離れるとばねのように戻る（1 回転なので、よけた先でも向きはそのまま）。
 * 飾りなので読み上げず、クリックも受け取らない。マウスが無い小さい画面では出さない。
 * 位置の計算は、動かない外側の枠（span）を基準にする（動いている図形自体を測ると、逃げた先を基準にしてしまう）
 * @param icons 並べるアイコン（lt-icons.ts の名前）
 * @param size HOME の見出しは large、フォームの見出しなどは small
 */
export function FleeingShapes({
  icons,
  className = "",
  size = "large",
}: {
  icons: readonly LtIconName[];
  className?: string;
  size?: "large" | "small";
}) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  const { reach, push } = MOTION[size];

  useEffect(() => {
    let frame = 0;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const allowed = motionAllowed();
        for (const el of refs.current) {
          if (!el?.parentElement) continue;
          const box = el.parentElement.getBoundingClientRect();
          const dx = e.clientX - (box.left + box.width / 2);
          const dy = e.clientY - (box.top + box.height / 2);
          const d = Math.hypot(dx, dy) || 1;
          if (allowed && d < reach) {
            const k = (reach - d) * push;
            el.style.transform = `translate(${(-dx / d) * k}px, ${(-dy / d) * k}px) rotate(360deg)`;
          } else {
            el.style.transform = "";
          }
        }
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [reach, push]);

  return (
    <div aria-hidden="true" className={`pointer-events-none hidden items-center md:flex ${size === "small" ? "gap-3" : "gap-5"} ${className}`}>
      {icons.map((name, i) => (
        <span key={`${name}-${i}`} className={size === "small" ? "block h-8 w-8" : "block h-14 w-14"}>
          <span
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="lt-flee block h-full w-full"
          >
            <svg viewBox="0 0 60 60" className="h-full w-full overflow-visible">
              {LT_ICONS[name].map((p, j) => (
                <path key={j} d={p.d} fill={p.fill} stroke="#e07a1f" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              ))}
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
