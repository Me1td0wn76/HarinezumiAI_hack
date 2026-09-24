import type { EventCommentDto, EventDetailDto, UserDto } from "@lt/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comment-section";
import { EventHeader } from "@/components/event-header";
import { EventPlace } from "@/components/event-place";
import { OrganizerPanel } from "@/components/organizer-panel";
import { ResponseForm } from "@/components/response-form";
import { ResponseGrid } from "@/components/response-grid";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;

  let detail: EventDetailDto;
  let comments: EventCommentDto[];
  let user: UserDto | null;
  try {
    // 互いに依存しないので並列に取得する。Cookie のトークン付きで取得すると、主催者本人には shareToken が返る
    [detail, comments, user] = await Promise.all([
      apiFetch<EventDetailDto>(`/events/${id}`),
      apiFetch<EventCommentDto[]>(`/events/${id}/comments`),
      getCurrentUser(),
    ]);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
  const isOrganizer = user?.id === detail.organizer.id;
  const myRow = user ? detail.responders.find((r) => r.responderKey === user.id) : undefined;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const shareUrl = detail.shareToken ? `${webUrl}/share/${detail.shareToken}` : null;

  // layout.tsx の <main> は余白を持たないため、ページごとにコンテナ（中央寄せ・最大幅・左右上下の余白）を持つ
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <EventHeader
        title={detail.title}
        status={detail.status}
        organizer={detail.organizer}
        confirmedDate={detail.confirmedDate}
        tags={detail.tags}
      />

      <EventPlace detail={detail} />

      {detail.description && (
        <section className="card">
          <h2 className="mb-2 font-display text-sm font-bold text-muted-foreground">発表内容</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.description}</p>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 font-display font-extrabold text-foreground">回答状況</h2>
        <ResponseGrid detail={detail} highlightKey={user?.id} />
      </section>

      {detail.status === "OPEN" && (
        <section className="card">
          <h2 className="mb-1 font-display font-extrabold text-foreground">
            {myRow ? "あなたの回答" : "参加可否を回答する"}
          </h2>
          {user ? (
            <ResponseForm eventId={detail.id} candidateDates={detail.candidateDates} initial={myRow?.answers} />
          ) : (
            <p className="text-sm text-muted-foreground">
              回答するには{" "}
              <Link href="/login" className="font-semibold text-secondary-foreground underline">
                ログイン
              </Link>{" "}
              してください。主催者から共有URLをもらった場合はログインなしで回答できます。
            </p>
          )}
        </section>
      )}

      {isOrganizer && <OrganizerPanel detail={detail} shareUrl={shareUrl} />}

      <CommentSection
        eventId={detail.id}
        organizerId={detail.organizer.id}
        comments={comments}
        viewerId={user?.id ?? null}
      />
    </div>
  );
}
