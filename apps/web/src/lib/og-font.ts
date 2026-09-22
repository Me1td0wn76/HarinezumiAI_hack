import 'server-only';

/**
 * OG 画像用の日本語フォント。
 * Noto Sans JP 全体は数MBあるので同梱せず、Google Fonts の `text=` で
 * 描画に必要な文字だけのサブセット（数KB）を取得する。
 * 取得結果はプロセス内でキャッシュし、失敗したら null（フォント指定なしで描画）を返す。
 */
const FAMILY = 'Noto Sans JP';
const WEIGHT = 700;
const CACHE_LIMIT = 200;
const cache = new Map<string, ArrayBuffer>();

export async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  // 同じ文字の集合なら同じサブセットになるので、重複を除いてソートしたものをキーにする
  const chars = [...new Set(text)].sort().join('');
  const hit = cache.get(chars);
  if (hit) return hit;

  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY)}:wght@${WEIGHT}&text=${encodeURIComponent(chars)}`;
    const css = await (await fetch(cssUrl)).text();
    // User-Agent を送らないと woff2 ではなく truetype が返る（Satori は ttf/otf/woff のみ対応）
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    cache.set(chars, data);
    return data;
  } catch {
    return null;
  }
}

export const OG_FONT_FAMILY = FAMILY;
export const OG_FONT_WEIGHT = WEIGHT;
