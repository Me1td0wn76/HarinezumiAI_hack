"use client";

import type { EventListQuery, EventSummaryDto, PageDto } from "@lt/shared";
import { useState, useTransition } from "react";
import { loadMoreEvents } from "@/actions/events";
import { EventCard } from "./event-card";

/**
 * 一覧 + 「もっと見る」。初回ページはサーバーで取得し、続きは Server Function で取りに行く。
 * 検索条件が変わったら親側で key を変えて作り直す（state を effect で同期しない）。
 */
export function EventList({ initial, query }: { initial: PageDto<EventSummaryDto>; query: EventListQuery }) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      try {
        const page = await loadMoreEvents(query, cursor);
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
        setError(null);
      } catch {
        setError("読み込みに失敗しました。もう一度お試しください");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="card text-center text-muted-foreground">
        <p>条件に合うLT会はありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {error ? <p className="text-center text-sm text-danger-foreground">{error}</p> : null}
      {cursor ? (
        <div className="text-center">
          <button type="button" onClick={loadMore} className="btn-secondary" disabled={pending}>
            {pending ? "読み込み中…" : "もっと見る"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
