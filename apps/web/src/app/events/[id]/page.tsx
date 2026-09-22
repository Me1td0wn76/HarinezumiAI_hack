import type { EventDetailDto } from "@lt/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/event-header";
import { OrganizerPanel } from "@/components/organizer-panel";
import { ResponseForm } from "@/components/response-form";
import { ResponseGrid } from "@/components/response-grid";
import { ShareButtons } from "@/components/share-buttons";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getEventDetail, webUrl } from "@/lib/events";
import { formatDateRange } from "@/lib/format";
import { eventDescription } from "@/lib/og-image";

/** 見つからない・不正な ID は 404 に寄せる */
async function loadDetail(id: string): Promise<EventDetailDto> {
  try {
    // Cookie のトークン付きで取得すると、主催者本人には shareToken が返る
    return await getEventDetail(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

/** OGP。X / LINE / Discord に貼ったときのカード表示に使われる */
export async function generateMetadata(props: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const detail = await loadDetail(id);
  const description = eventDescription(detail);
  return {
    title: detail.title,
    description,
    openGraph: { title: detail.title, description, type: "article", url: `/events/${id}` },
    twitter: { card: "summary_large_image", title: detail.title, description },
  };
}

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;

  // generateMetadata と同じ関数なので React.cache で 1 回しか取得されない
  const [detail, user] = await Promise.all([loadDetail(id), getCurrentUser()]);
  const isOrganizer = user?.id === detail.organizer.id;
  const myRow = user ? detail.responders.find((r) => r.responderKey === user.id) : undefined;
  const shareUrl = detail.shareToken ? webUrl(`/share/${detail.shareToken}`) : null;
  const shareText = detail.confirmedDate
    ? `「${detail.title}」${formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)} 開催`
    : `「${detail.title}」参加できる日を回答しよう`;

  // layout.tsx の <main> は余白を持たないため、ページごとにコンテナ（中央寄せ・最大幅・左右上下の余白）を持つ
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <EventHeader
        title={detail.title}
        status={detail.status}
        organizer={detail.organizer}
        confirmedDate={detail.confirmedDate}
      />
      <ShareButtons url={webUrl(`/events/${detail.id}`)} text={shareText} compact />

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
