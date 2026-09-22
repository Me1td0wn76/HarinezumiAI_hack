import type { EventDetailDto } from "@lt/shared";
import { notFound } from "next/navigation";
import { EventStatusBadge } from "@/components/event-status-badge";
import { GuestResponseForm } from "@/components/guest-response-form";
import { ResponseGrid } from "@/components/response-grid";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDateRange } from "@/lib/format";

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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground">{detail.title}</h1>
          <EventStatusBadge status={detail.status} />
        </div>
        <p className="text-sm text-subtle">主催: {detail.organizer.displayName}</p>
        {detail.confirmedDate && (
          <div className="flex items-center gap-3 rounded-[1.25rem] border-[1.5px] border-success bg-success-bg px-4 py-3">
            <span className="text-2xl">📅</span>
            <div>
              <div className="mb-0.5 font-display text-xs font-bold text-success-foreground">開催日確定</div>
              <div className="font-display text-base font-extrabold text-foreground">
                {formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)}
              </div>
            </div>
          </div>
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
