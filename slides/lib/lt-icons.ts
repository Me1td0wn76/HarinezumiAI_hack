// apps/web/src/components/lt-icons.ts の写し。スライドでもアプリと同じアイコンを使う
/**
 * 見出しの横に置く飾りのアイコン（fleeing-shapes.tsx）。LT会にちなんだものを、60×60 の中の path で描く。
 * 線はすべて同じオレンジ（描く側で指定）で、塗りだけを持つ。fill が "none" のものは線だけ
 */
const Y = "#ffe45c"; // 黄色
const O = "#ff9f43"; // オレンジ
const P = "#ffd7b0"; // ピーチ
const W = "#ffffff";
const N = "none";

/** 中心 (cx, cy)・半径 r の円を path で描く */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
}

export interface IconPath {
  d: string;
  fill: string;
}

export const LT_ICONS = {
  calendar: [
    { d: "M8 12h44v40H8z", fill: W },
    { d: "M8 12h44v10H8z", fill: O },
    { d: "M20 7v10M40 7v10M20 32h.1M30 32h.1M40 32h.1M20 42h.1M30 42h.1", fill: N },
  ],
  mic: [
    { d: "M21 15a9 9 0 0 1 18 0v12a9 9 0 0 1-18 0z", fill: Y },
    { d: "M13 27a17 17 0 0 0 34 0M30 44v9M21 54h18", fill: N },
  ],
  spotlight: [
    { d: "M24 5h12l12 38H12z", fill: "rgba(255,228,92,.55)" },
    { d: "M8 46a22 7 0 0 0 44 0a22 7 0 0 0-44 0z", fill: Y },
  ],
  magnifier: [
    { d: circle(25, 25, 17), fill: W },
    { d: "M38 38l15 15", fill: N },
  ],
  pencil: [
    { d: "M38 8l14 14L22 52H8V38z", fill: Y },
    { d: "M8 38v14h14z", fill: P },
    { d: "M32 14l14 14", fill: N },
  ],
  bulb: [
    { d: "M30 6a16 16 0 0 1 10 28c-2 2-3 4-3 7H23c0-3-1-5-3-7A16 16 0 0 1 30 6z", fill: Y },
    { d: "M23 47h14M25 53h10", fill: N },
  ],
  flag: [
    { d: "M15 8h32l-7 10 7 10H15z", fill: O },
    { d: "M15 5v50", fill: N },
  ],
  clap: [
    {
      d: "M19 52c-8-6-10-16-6-24l8-14a3 3 0 0 1 5 3l-4 9 12-16a3 3 0 0 1 5 3L28 30l14-12a3 3 0 0 1 4 4L33 35l10-6a3 3 0 0 1 3 5L32 46c-4 4-9 8-13 6z",
      fill: P,
    },
    { d: "M44 6l2-4M52 12l4-2M50 21l4 1", fill: N },
  ],
  check: [
    { d: circle(30, 30, 25), fill: Y },
    { d: "M18 31l8 8 16-17", fill: N },
  ],
  slide: [
    { d: "M6 8h48v32H6z", fill: W },
    { d: "M16 32v-8M26 32V18M36 32v-12M46 32v-5M30 40v8M20 54l10-6 10 6", fill: N },
  ],
  tag: [
    { d: "M6 10v18l26 26 22-22L28 6H10a4 4 0 0 0-4 4z", fill: P },
    { d: circle(17, 17, 4), fill: W },
  ],
  laptop: [
    { d: "M12 10h36v27H12z", fill: W },
    { d: "M4 42h52l-4 8H8z", fill: Y },
  ],
  pin: [
    { d: "M30 56S12 37 12 24a18 18 0 0 1 36 0c0 13-18 32-18 32z", fill: O },
    { d: circle(30, 24, 7), fill: W },
  ],
  timer: [
    { d: circle(30, 34, 20), fill: P },
    { d: "M25 7h10M30 7v7M30 34V22M30 34l8 5", fill: N },
  ],
  hourglass: [
    { d: "M15 6h30M15 54h30M18 6c0 16 24 16 24 24S18 38 18 54M42 6c0 16-24 16-24 24s24 8 24 24", fill: N },
    { d: "M22 50c2-6 14-6 16 0z", fill: O },
  ],
  bell: [
    { d: "M30 6a4 4 0 0 1 4 4v2a15 15 0 0 1 11 14v12l5 6H10l5-6V26a15 15 0 0 1 11-14v-2a4 4 0 0 1 4-4z", fill: Y },
    { d: "M24 49a6 6 0 0 0 12 0", fill: N },
  ],
  megaphone: [
    { d: "M8 24h10l24-14v40L18 36H8z", fill: O },
    { d: "M16 36l4 14h7l-3-14", fill: P },
    { d: "M48 22c3 3 3 13 0 16", fill: N },
  ],
  bubble: [
    { d: "M9 8h42a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H27L15 53V42H9a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5z", fill: W },
    { d: "M17 25h.1M30 25h.1M43 25h.1", fill: N },
  ],
} satisfies Record<string, IconPath[]>;

export type LtIconName = keyof typeof LT_ICONS;
