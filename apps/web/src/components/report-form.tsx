"use client";

import { REPORT_REASON, REPORT_REASON_LABEL, type ReportTargetType } from "@lt/shared";
import { useActionState, useId } from "react";
import { report } from "@/actions/moderation";
import { FormMessage } from "./form-message";

/** LT会・ユーザーの通報フォーム。同じ対象を再度通報すると理由が上書きされる */
export function ReportForm({ targetType, targetId }: { targetType: ReportTargetType; targetId: string }) {
  const [state, action, pending] = useActionState(report, undefined);
  const id = useId();

  if (state?.success) {
    return (
      <p className="rounded-xl border border-success bg-success-bg px-3 py-2 text-sm text-success-foreground">
        通報しました。運営が内容を確認します。
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <fieldset>
        <legend className="label">理由</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {REPORT_REASON.map((r, i) => (
            <label key={r} className="flex items-center gap-1.5 text-sm">
              <input type="radio" name="reason" value={r} required defaultChecked={i === 0} className="accent-primary" />
              {REPORT_REASON_LABEL[r]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor={`${id}-detail`}>
          補足（任意）
        </label>
        <textarea id={`${id}-detail`} name="detail" className="input" rows={2} maxLength={1000} />
      </div>
      <FormMessage state={state} />
      <button type="submit" className="btn-danger text-xs" disabled={pending}>
        {pending ? "送信中…" : "通報する"}
      </button>
    </form>
  );
}
