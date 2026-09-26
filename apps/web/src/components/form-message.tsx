import type { ActionState } from "@/actions/types";

/**
 * Server Function の結果（エラー / 成功）を表示する。
 * 成功はチェックマークが描かれながらふわっと出る（押したのに反応がない、と感じさせないため）。
 * どちらも role で読み上げる（エラーは alert、成功は status）
 */
export function FormMessage({ state, successText }: { state: ActionState; successText?: string }) {
  if (state?.error) {
    return (
      <p
        role="alert"
        className="whitespace-pre-line rounded-2xl border-2 border-danger bg-danger-bg px-4 py-2.5 text-sm font-bold text-danger-foreground"
      >
        {state.error}
      </p>
    );
  }
  if (state?.success && successText) {
    return (
      <p
        role="status"
        className="lt-rise flex items-center gap-2 rounded-2xl border-2 border-success bg-success-bg px-4 py-2.5 text-sm font-bold text-success-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="lt-check h-6 w-6 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 5 5 9-10" />
        </svg>
        {successText}
      </p>
    );
  }
  return null;
}
