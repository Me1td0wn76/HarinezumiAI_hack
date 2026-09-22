import Link from "next/link";

/** タグの表示。クリックでタグページへ */
export function TagChip({ tag, count, active = false }: { tag: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={`badge transition hover:-translate-y-0.5 ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
      }`}
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
