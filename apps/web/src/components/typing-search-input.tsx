"use client";

import { useEffect, useState } from "react";
import { motionAllowed, useEffectsEnabled } from "./click-effects";

/** 検索欄に1文字ずつ打ち込んで見せる例 */
const SAMPLES = ["React 初心者歓迎", "オンライン 金曜夜", "デザイン", "はじめての登壇", "Rust"];
const TYPE_MS = 130;
/** 打ち終わってから次の例に移るまで（TYPE_MS の回数） */
const HOLD_TICKS = 14;

/**
 * 空の検索欄に、何を探せるかの例を1文字ずつ打ち込んで見せる（placeholder を書き換えるだけで、値は入れない）。
 * フォーカス中・演出 OFF・「動きを減らす」設定のときは普通の placeholder に戻す。
 * サーバーで描くときも普通の placeholder なので、ハイドレーションの差は出ない
 */
export function TypingSearchInput({
  placeholder,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { placeholder: string }) {
  const enabled = useEffectsEnabled();
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || focused || !motionAllowed()) return;
    let sample = 0;
    let tick = 0;
    const timer = setInterval(() => {
      const word = SAMPLES[sample];
      tick++;
      if (tick > word.length + HOLD_TICKS) {
        sample = (sample + 1) % SAMPLES.length;
        tick = 0;
      }
      setTyped(SAMPLES[sample].slice(0, tick));
    }, TYPE_MS);
    return () => {
      clearInterval(timer);
      setTyped(null);
    };
  }, [enabled, focused]);

  return (
    <input
      {...props}
      placeholder={typed === null || focused ? placeholder : `例: ${typed}｜`}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}
