"use client";

import { useState } from "react";

interface Row {
  key: number;
}

/**
 * 候補日を複数入力する欄。
 * startsAt[] / endsAt[] と、ローカル時刻を UTC に直すための tzOffset を送る。
 */
export function CandidateDatesField({ min = 1 }: { min?: number }) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: min }, (_, i) => ({ key: i })));
  const [nextKey, setNextKey] = useState(min);

  function add() {
    setRows((r) => [...r, { key: nextKey }]);
    setNextKey((k) => k + 1);
  }

  function remove(key: number) {
    setRows((r) => (r.length > min ? r.filter((row) => row.key !== key) : r));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="tzOffset" value={new Date().getTimezoneOffset()} />
      {rows.map((row, i) => (
        <div key={row.key} className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">
            {i + 1}
          </span>
          <input type="datetime-local" name="startsAt" className="input w-auto" required aria-label="開始日時" />
          <span className="text-sm text-subtle">〜</span>
          <input type="datetime-local" name="endsAt" className="input w-auto" aria-label="終了日時（任意）" />
          <button
            type="button"
            onClick={() => remove(row.key)}
            className="text-sm font-bold text-subtle hover:text-danger-foreground disabled:invisible"
            disabled={rows.length <= min}
            aria-label="この候補日を削除"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-secondary">
        ＋ 候補日を追加
      </button>
    </div>
  );
}
