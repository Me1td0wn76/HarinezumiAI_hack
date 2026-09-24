import type { EventSummaryDto, MyEventsDto } from "@lt/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BlockButton } from "@/components/block-button";
import { EventCard } from "@/components/event-card";
import { ProfileForm } from "@/components/profile-form";
import { ApiError, apiFetch } from "@/lib/api";
import { getMyBlocks, requireUser } from "@/lib/auth";

/** 主催・参加したLT会の一覧 */
function History({ title, events, empty }: { title: string; events: EventSummaryDto[]; empty: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-extrabold text-foreground">{title}</h2>
        <span className="badge bg-secondary text-secondary-foreground">{events.length} 件</span>
      </div>
      {events.length === 0 ? (
        <p className="card text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function MePage() {
  // 履歴の取得はユーザー確認と並行して始める。未ログインの 401 は requireUser 側のリダイレクトに任せる
  const historyPromise = apiFetch<MyEventsDto>("/users/me/events").catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  });
  const blocksPromise = getMyBlocks();
  const user = await requireUser();
  const [history, blocks] = await Promise.all([historyPromise, blocksPromise]);
  if (!history) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-2xl font-black text-foreground">プロフィール</h1>
        <ProfileForm user={user} />
      </div>

      <History
        title="主催したLT会"
        events={history.organized}
        empty={
          <>
            まだ主催したLT会はありません。
            <Link href="/events/new" className="font-semibold text-secondary-foreground underline">
              LT会を作る
            </Link>
          </>
        }
      />
      <History
        title="参加したLT会"
        events={history.participated}
        empty="候補日に回答したLT会がここに表示されます。"
      />

      <section className="card mx-auto max-w-md space-y-3">
        <h2 className="font-display font-extrabold text-foreground">ブロック中のユーザー</h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">ブロックしているユーザーはいません。</p>
        ) : (
          <ul className="divide-y divide-card-border">
            {blocks.map((b) => (
              <li key={b.id} className="py-2">
                <BlockButton userId={b.id} displayName={b.displayName} blocked />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
