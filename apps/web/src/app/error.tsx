"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-lg font-bold">エラーが発生しました</p>
      <p className="mt-2 text-sm text-stone-500">{error.message}</p>
      <button type="button" onClick={reset} className="btn-secondary mt-4">
        再読み込み
      </button>
    </div>
  );
}
