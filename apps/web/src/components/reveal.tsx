"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { motionAllowed } from "./click-effects";

/**
 * スクロールして画面に入ったときに、下からふわっと出す。
 * 最初から画面内にあるものと、JS が動かないとき・演出 OFF のときは何もせず、そのまま見せる
 * （隠すクラスは画面外にあるときだけ JS が付ける）。
 * 中の .lt-marker にはマーカーが引かれ、.lt-pop は弾む（globals.css）
 * @param delay 同じ行に並ぶカードを少しずつ遅らせる（ミリ秒）
 * @param tilt 出てくる前の傾き（度）。着地するように見せる
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  tilt = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  tilt?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    // 既に見えているものは隠さない（読み込んだ瞬間にちらつかないように）
    if (el.getBoundingClientRect().top < window.innerHeight - 40) return;
    el.classList.add("lt-reveal-hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.remove("lt-reveal-hidden");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("lt-reveal-hidden");
    };
  }, []);

  const style = { transitionDelay: `${delay}ms`, "--lt-tilt": `${tilt}deg` } as CSSProperties;
  const Tag = as;
  return (
    <Tag ref={ref} className={`lt-reveal ${className}`} style={style}>
      {children}
    </Tag>
  );
}
