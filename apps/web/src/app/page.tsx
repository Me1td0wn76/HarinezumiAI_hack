import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const [events, user] = await Promise.all([apiFetch<EventSummaryDto[]>("/events"), getCurrentUser()]);
  const open = events.filter((e) => e.status === "OPEN");
  const others = events.filter((e) => e.status !== "OPEN");

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">日程調整中のLT会</h1>
          {user && (
            <Link href="/events/new" className="btn-primary">
              ＋ LT会を作る
            </Link>
          )}
        </div>
        {open.length === 0 ? (
          <div className="card text-center text-stone-500">
            <p>調整中のLT会はありません。</p>
            {!user && (
              <p className="mt-2 text-sm">
                <Link href="/register" className="text-emerald-700 underline">
                  登録
                </Link>
                してLT会を作ってみましょう。
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {open.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-stone-600">開催決定・終了</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
