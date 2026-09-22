import type { EventDetailDto } from "@lt/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventStatusBadge } from "@/components/event-status-badge";
import { GuestResponseForm } from "@/components/guest-response-form";
import { ResponseGrid } from "@/components/response-grid";
import { ShareButtons } from "@/components/share-buttons";
import { ApiError } from "@/lib/api";
import { getSharedEvent, webUrl } from "@/lib/events";
import { formatDateRange } from "@/lib/format";
import { eventDescription } from "@/lib/og-image";

async function loadShared(token: string): Promise<EventDetailDto> {
  try {
    return await getSharedEvent(token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

/**
 * OGP は付けるが、共有URL は回答用の非公開リンクなので検索エンジンには載せない。
 * canonical は公開の詳細ページに向ける
 */
export async function generateMetadata(props: PageProps<"/share/[token]">): Promise<Metadata> {
  const { token } = await props.params;
  const detail = await loadShared(token);
  const description = eventDescription(detail);
  return {
    title: detail.title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `/events/${detail.id}` },
    openGraph: { title: detail.title, description, type: "article", url: `/share/${token}` },
    twitter: { card: "summary_large_image", title: detail.title, description },
  };
}

/** 共有URL から開くページ。ログイン不要で回答できる */
export default async function SharePage(props: PageProps<"/share/[token]">) {
  const { token } = await props.params;
  const detail = await loadShared(token);
  const shareText = detail.confirmedDate
    ? `「${detail.title}」${formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)} 開催`
    : `「${detail.title}」参加できる日を回答しよう`;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{detail.title}</h1>
          <EventStatusBadge status={detail.status} />
        </div>
        <p className="text-sm text-stone-500">主催: {detail.organizer.displayName}</p>
        <ShareButtons url={webUrl(`/share/${token}`)} text={shareText} compact />
        {detail.confirmedDate && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
            📅 開催日: <strong>{formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)}</strong>
          </p>
        )}
      </header>

      {detail.description && (
        <section className="card">
          <h2 className="mb-2 text-sm font-medium text-stone-500">発表内容</h2>
          <p className="whitespace-pre-wrap text-sm">{detail.description}</p>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 font-bold">回答状況</h2>
        <ResponseGrid detail={detail} />
      </section>

      {detail.status === "OPEN" ? (
        <section className="card">
          <h2 className="mb-1 font-bold">参加可否を回答する</h2>
          <p className="mb-3 text-xs text-stone-500">ログインは不要です。同じブラウザからなら後で回答を変更できます。</p>
          <GuestResponseForm token={token} candidateDates={detail.candidateDates} responders={detail.responders} />
        </section>
      ) : (
        <p className="text-sm text-stone-500">このLT会の回答は締め切られています。</p>
      )}
    </div>
  );
}
