import type { EventDetailDto } from "@lt/shared";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/event-header";
import { GuestResponseForm } from "@/components/guest-response-form";
import { ResponseGrid } from "@/components/response-grid";
import { ApiError, apiFetch } from "@/lib/api";

/** 共有URL から開くページ。ログイン不要で回答できる */
export default async function SharePage(props: PageProps<"/share/[token]">) {
  const { token } = await props.params;

  let detail: EventDetailDto;
  try {
    detail = await apiFetch<EventDetailDto>(`/share/${token}`, { auth: false });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

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
