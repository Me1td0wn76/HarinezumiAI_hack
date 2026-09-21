import type { ActionState } from "@/actions/types";

/** Server Function の結果（エラー / 成功）を表示する */
export function FormMessage({ state, successText }: { state: ActionState; successText?: string }) {
  if (state?.error) {
    return (
      <p className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state?.success && successText) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {successText}
      </p>
    );
  }
  return null;
}
