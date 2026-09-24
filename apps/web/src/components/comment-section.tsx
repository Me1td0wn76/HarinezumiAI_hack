import type { EventCommentDto } from "@lt/shared";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { CommentForm } from "./comment-form";
import { DeleteCommentButton } from "./delete-comment-button";

/**
 * LT会詳細ページ下部のコメント欄（主催者・参加者間の連絡）。
 * 一覧はサーバーで描画し、投稿フォームと削除ボタンだけを Client Component にしている。
 * 投稿はログインユーザーのみ。削除は投稿者本人と主催者に許す（API 側でも同じ判定）
 * @param viewerId ログイン中のユーザー。未ログインなら null で、投稿フォームの代わりにログイン案内を出す
 */
export function CommentSection({
  eventId,
  organizerId,
  comments,
  viewerId,
}: {
  eventId: string;
  organizerId: string;
  comments: EventCommentDto[];
  viewerId: string | null;
}) {
  return (
    <section className="card space-y-4">
      <h2 className="font-display font-extrabold text-foreground">
        コメント <span className="text-sm text-subtle">{comments.length}</span>
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだコメントはありません。</p>
      ) : (
        <ul className="divide-y divide-card-border">
          {comments.map((c) => (
            <li key={c.id} className="py-3">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-sm font-bold text-foreground">{c.author.displayName}</span>
                {c.author.id === organizerId && (
                  <span className="badge bg-secondary px-2 py-0.5 text-secondary-foreground">主催者</span>
                )}
                <time dateTime={c.createdAt} className="text-xs text-subtle">
                  {formatDateTime(c.createdAt)}
                </time>
                {viewerId && (viewerId === c.author.id || viewerId === organizerId) && (
                  <span className="ml-auto">
                    <DeleteCommentButton eventId={eventId} commentId={c.id} />
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {viewerId ? (
        <CommentForm eventId={eventId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          コメントするには{" "}
          <Link href="/login" className="font-semibold text-secondary-foreground underline">
            ログイン
          </Link>{" "}
          してください。
        </p>
      )}
    </section>
  );
}
