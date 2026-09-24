import { type AdminReportDto, REPORT_REASON, REPORT_REASON_LABEL } from "@lt/shared";
import Link from "next/link";
import { ModerateEventForm } from "@/components/moderate-event-form";
import { apiFetch } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

/** 運営画面: 通報を対象ごとに多い順で並べ、LT会の非表示 / 再表示を行う */
export default async function AdminPage() {
  await requireAdmin();
  const reports = await apiFetch<AdminReportDto[]>("/admin/reports");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <span className="eyebrow">⚡ ADMIN</span>
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">通報の確認</h1>
        <p className="text-sm text-muted-foreground">
          通報の多い順に表示しています。LT会の非表示・再表示の操作はログに残ります。
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="card text-center text-muted-foreground">通報はありません。</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={`${r.targetType}:${r.targetId}`} className="card space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-muted text-muted-foreground">{r.targetType === "EVENT" ? "LT会" : "ユーザー"}</span>
                {r.targetType === "EVENT" && r.label ? (
                  <Link href={`/events/${r.targetId}`} className="font-display font-bold text-foreground underline">
                    {r.label}
                  </Link>
                ) : (
                  <span className="font-display font-bold text-foreground">{r.label ?? "（削除済み）"}</span>
                )}
                {r.hidden && <span className="badge bg-danger-bg text-danger-foreground">非表示中</span>}
                <span className="ml-auto font-display text-sm font-extrabold text-danger-foreground">
                  通報 {r.reportCount} 件
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {REPORT_REASON.filter((reason) => r.reasonCounts[reason])
                  .map((reason) => `${REPORT_REASON_LABEL[reason]} ${r.reasonCounts[reason]}`)
                  .join(" / ")}
                {" ・ "}最終 {formatDateTime(r.lastReportedAt)}
              </p>

              {r.recent.some((x) => x.detail) && (
                <ul className="space-y-1 border-l-2 border-card-border pl-3 text-sm">
                  {r.recent
                    .filter((x) => x.detail)
                    .map((x) => (
                      <li key={x.createdAt} className="whitespace-pre-wrap break-words">
                        <span className="text-xs text-subtle">{REPORT_REASON_LABEL[x.reason]}: </span>
                        {x.detail}
                      </li>
                    ))}
                </ul>
              )}

              {r.targetType === "EVENT" && r.hidden !== null && (
                <ModerateEventForm eventId={r.targetId} hidden={r.hidden} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
