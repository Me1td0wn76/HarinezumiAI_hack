import type { EventDetailDto } from "@lt/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/event-header";
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

  // layout.tsx の <main> は余白を持たないため、ページごとにコンテナ（中央寄せ・最大幅・左右上下の余白）を持つ
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <EventHeader
        title={detail.title}
        status={detail.status}
        organizer={detail.organizer}
        confirmedDate={detail.confirmedDate}
      />
      <ShareButtons url={webUrl(`/share/${token}`)} text={shareText} compact />

      {detail.description && (
        <section className="card">
          <h2 className="mb-2 font-display text-sm font-bold text-muted-foreground">発表内容</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.description}</p>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 font-display font-extrabold text-foreground">回答状況</h2>
        <ResponseGrid detail={detail} />
      </section>

      {detail.status === "OPEN" ? (
        <section className="card">
          <h2 className="mb-1 font-display font-extrabold text-foreground">参加可否を回答する</h2>
          <p className="mb-3 text-xs text-subtle">ログインは不要です。同じブラウザからなら後で回答を変更できます。</p>
          <GuestResponseForm token={token} candidateDates={detail.candidateDates} responders={detail.responders} />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">このLT会の回答は締め切られています。</p>
      )}
    </div>
  );
}
