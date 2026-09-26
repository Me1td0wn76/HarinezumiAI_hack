import type { TagCountDto } from "@lt/shared";
import Link from "next/link";

/** 1回分の並びに最低これだけ置く。タグが少なくても、広い画面で帯の右側が空かないようにする */
const MIN_ITEMS = 16;

/**
 * 「LT会を探す」の黄色い帯の下で、人気のタグをゆっくり横に流す。押すとそのタグのページへ。ホバーで止まる。
 * 同じタグは一覧の上の「人気のタグ」にもあるので、この帯は飾りとして読み上げ・Tab 移動の対象から外す。
 * 切れ目なく流すため同じ並びを2回つなげ、半分動いたら最初に戻す（globals.css の .lt-marquee）。
 * 「動きを減らす」設定・演出 OFF のときは帯ごと出さない
 */
export function TagMarquee({ tags }: { tags: TagCountDto[] }) {
  if (tags.length === 0) return null;
  // タグが少ないときは同じ並びを繰り返して埋める
  const items = Array.from({ length: Math.ceil(MIN_ITEMS / tags.length) }, () => tags).flat();
  const row = (copy: string) => (
    // 2つの並びのあいだも同じ間隔になるよう、gap ではなく右の余白で区切る
    <div className="flex shrink-0">
      {items.map((t, i) => (
        <Link
          key={`${copy}-${i}`}
          href={`/tags/${encodeURIComponent(t.tag)}`}
          tabIndex={-1}
          // 同じタグを何度も並べた飾りなので、先読みはしない（一覧の上の「人気のタグ」側で足りる）
          prefetch={false}
          className="pill mr-3 shrink-0 bg-white px-4 py-1.5 text-sm"
        >
          #{t.tag}
          <span className="opacity-70">{t.count}件</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="lt-marquee-wrap relative overflow-hidden border-t-2 border-foreground/10 bg-secondary py-3">
      <div className="lt-marquee flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
