import type { ActionState } from "@/actions/types";

/** Server Function の結果（エラー / 成功）を表示する */
export function FormMessage({ state, successText }: { state: ActionState; successText?: string }) {
  if (state?.error) {
    return (
      <p className="whitespace-pre-line rounded-xl border border-danger bg-danger-bg px-3 py-2 text-sm text-danger-foreground">
        {state.error}
      </p>
    );
  }
  if (state?.success && successText) {
    return (
      <p className="rounded-xl border border-success bg-success-bg px-3 py-2 text-sm text-success-foreground">
        {successText}
      </p>
    );
  }
  return null;
}
