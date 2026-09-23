import type { EventDetailDto } from "@lt/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventStatusBadge } from "@/components/event-status-badge";
import { EventHeader } from "@/components/event-header";
import { OrganizerPanel } from "@/components/organizer-panel";
import { ResponseForm } from "@/components/response-form";
import { ResponseGrid } from "@/components/response-grid";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDateRange } from "@/lib/format";

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;

  let detail: EventDetailDto;
  try {
    // Cookie のトークン付きで取得すると、主催者本人には shareToken が返る
    detail = await apiFetch<EventDetailDto>(`/events/${id}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
  const user = await getCurrentUser();
  const isOrganizer = user?.id === detail.organizer.id;
  const myRow = user ? detail.responders.find((r) => r.responderKey === user.id) : undefined;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const shareUrl = detail.shareToken ? `${webUrl}/share/${detail.shareToken}` : null;

  // layout.tsx の <main> は余白を持たないため、ページごとにコンテナ（中央寄せ・最大幅・左右上下の余白）を持つ
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* <EventHeader
        title={detail.title}
        status={detail.status}
        organizer={detail.organizer}
        confirmedDate={detail.confirmedDate}
      /> */}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{detail.title}</h1>
          <EventStatusBadge status={detail.status} />
        </div>
        <p className="text-sm text-stone-500">
          主催:{" "}
          <Link href={`/users/${detail.organizer.id}`} className="text-emerald-700 underline">
            {detail.organizer.displayName}
          </Link>
        </p>
        {detail.confirmedDate && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
            📅 開催日: <strong>{formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)}</strong>
          </p>
        )}
      </header>

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
    </div>
  );
}
