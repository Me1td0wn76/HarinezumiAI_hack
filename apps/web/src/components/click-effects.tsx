"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * クリック演出の ON / OFF。ブラウザごとの好みなので localStorage に持つ（共有する必要のない、閲覧者ごとの設定）。
 * 読み書きに失敗する環境（プライベートモードなど）では、常に ON として動く
 */
const STORAGE_KEY = "lt-effects";
const listeners = new Set<() => void>();
/** 読み込んだ設定の控え。null は未読み込み */
let memo: boolean | null = null;

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function setEnabled(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // 保存できなくても、このページを開いている間は切り替わるようにする
  }
  memo = on;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * イベントハンドラーの中で使う判定。演出が ON で、OS の「視差効果を減らす」設定も無いときだけ true
 */
export function motionAllowed(): boolean {
  if (!(memo ??= readEnabled())) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 演出が ON か。サーバー描画と最初の描画では ON として扱い、hydration 後に保存値を反映する */
export function useEffectsEnabled(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (memo ??= readEnabled()),
    () => true,
  );
}

/** これらの要素（とその中）をクリックしたときは波紋を出さない。操作の邪魔をしないため */
const INTERACTIVE = "a,button,input,textarea,select,label,summary,[role=button],[contenteditable=true]";

interface Ripple {
  id: number;
  x: number;
  y: number;
  /** 波紋の色（RIPPLE_COLORS のどれか） */
  color: string;
}

/**
 * 何もない所をクリックすると、その位置からオレンジの波紋が広がる。layout.tsx に1つだけ置く。
 * 文字を選択したとき・「動きを減らす」設定のとき・OFF にしたときは出さない
 */
/** 波紋の色。押すたびにこの中からランダムに選ぶ（同じ色は続けない） */
const RIPPLE_COLORS = [
  "rgba(255, 159, 67, 0.45)", // オレンジ
  "rgba(255, 208, 0, 0.5)", // 黄色
  "rgba(255, 143, 163, 0.45)", // ピンク
  "rgba(92, 200, 255, 0.45)", // 水色
  "rgba(107, 214, 138, 0.45)", // ミント
  "rgba(177, 140, 255, 0.45)", // ラベンダー
];

export function ClickRipples() {
  const enabled = useEffectsEnabled();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const seq = useRef(0);
  const lastColor = useRef(-1);

  // CSS だけで動く演出（○△× の輪など）も止められるよう、ページの根元に ON / OFF を書いておく
  useEffect(() => {
    document.documentElement.dataset.effects = enabled ? "on" : "off";
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Set<ReturnType<typeof setTimeout>>();

    function onClick(e: MouseEvent) {
      if (reduced.matches || e.button !== 0) return;
      const target = e.target as Element | null;
      if (target?.closest?.(INTERACTIVE)) return;
      if (window.getSelection()?.toString()) return;
      const id = ++seq.current;
      // 直前と同じ色にならないよう、残りの色から選ぶ
      const first = lastColor.current < 0;
      let color = Math.floor(Math.random() * (RIPPLE_COLORS.length - (first ? 0 : 1)));
      if (!first && color >= lastColor.current) color++;
      lastColor.current = color;
      setRipples((rs) => [...rs.slice(-4), { id, x: e.clientX, y: e.clientY, color: RIPPLE_COLORS[color] }]);
      const t = setTimeout(() => {
        setRipples((rs) => rs.filter((r) => r.id !== id));
        timers.delete(t);
      }, 950);
      timers.add(t);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach(clearTimeout);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div aria-hidden="true">
      {ripples.map((r) => (
        <span key={r.id} className="lt-ripple" style={{ left: r.x, top: r.y, background: r.color }} />
      ))}
    </div>
  );
}

/** フッターに置く ON / OFF の切り替え */
export function EffectsToggle() {
  const enabled = useEffectsEnabled();
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => setEnabled(!enabled)}
      className="rounded-full border-2 border-[#e0a800] bg-white px-4 py-1.5 font-display text-xs font-bold text-foreground transition hover:bg-card focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      動きの演出: {enabled ? "ON" : "OFF"}
    </button>
  );
}
