import Link from "next/link";

/** タグの表示。クリックでタグページへ */
export function TagChip({ tag, count, active = false }: { tag: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={`badge transition hover:bg-emerald-100 hover:text-emerald-800 ${
        active ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white" : "bg-stone-100 text-stone-600"
      }`}
      aria-label={count !== undefined ? `#${tag}（${count}件）` : `#${tag}`}
    >
      #{tag}
      {count !== undefined ? (
        <span className="ml-1 opacity-70" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
