"use client";

import { useSyncExternalStore } from "react";
import { HeroShapes } from "./hero-shapes";

/** 稲妻が満タンになる区切りの数（基本情報・開催形式・候補日。event-form.tsx の左の番号と同じ） */
export const CREATE_STEPS = 3;

// 入力フォーム（event-form.tsx）と、ページ上部の帯の稲妻は離れた場所にあるので、小さなストアで進み具合を渡す
let filled = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 入力済みの項目の数を知らせる（event-form.tsx から呼ぶ） */
export function setCreateProgress(count: number) {
  if (count === filled) return;
  filled = count;
  listeners.forEach((l) => l());
}

/**
 * 「LT会を作る」の帯の図形。フォームの入力が進むほど稲妻がオレンジに満ち、全部入ると光る。
 * 飾りなので、同じ内容は右の欄のチェックでも文字で伝えている
 */
export function CreateHeroShapes() {
  const count = useSyncExternalStore(subscribe, () => filled, () => 0);
  return (
    <HeroShapes
      size="small"
      charge={count / CREATE_STEPS}
      chargeLabel={count >= CREATE_STEPS ? "準備OK！" : `充電 ${count} / ${CREATE_STEPS}`}
    />
  );
}
