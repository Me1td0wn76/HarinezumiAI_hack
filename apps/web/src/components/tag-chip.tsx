import Link from "next/link";

/** タグの表示。クリックでタグページへ */
export function TagChip({ tag, count, active = false }: { tag: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={`pill px-3 py-1 text-xs ${active ? "pill-active" : ""}`}
      aria-label={count !== undefined ? `#${tag}（${count}件）` : `#${tag}`}
    >
      #{tag}
      {count !== undefined ? (
        <span className="opacity-70" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
