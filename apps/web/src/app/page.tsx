import type { EventSummaryDto } from "@lt/shared";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const [events, user] = await Promise.all([apiFetch<EventSummaryDto[]>("/events"), getCurrentUser()]);
  const open = events.filter((e) => e.status === "OPEN");
  const others = events.filter((e) => e.status !== "OPEN");
  // 統計バー（ヒーロー下の黄色い帯）の「開催確定」件数に使う
  const confirmed = events.filter((e) => e.status === "CONFIRMED");
  // 統計バーに表示する4項目。EventSummaryDto から取得済みのデータだけで集計する（追加のAPI呼び出しはしない）
  const stats = [
    { label: "LT会", value: events.length },
    { label: "候補日", value: events.reduce((s, e) => s + e.candidateDateCount, 0) },
    { label: "回答者", value: events.reduce((s, e) => s + e.responderCount, 0) },
    { label: "開催確定", value: confirmed.length },
  ];

  return (
    // ルートレイアウト（layout.tsx）の <main> が持つ px-4 py-8 を打ち消し、
    // ヒーロー/統計バーの背景色を画面幅いっぱいに表示するための負のマージン
    <div className="-mx-4 -my-8">
      {/* Hero */}
      <section
        className="border-b border-card-border"
        style={{ background: "linear-gradient(160deg, #FFFBEA 0%, #FFFDF4 60%)" }}
      >
        <div className="mx-auto max-w-4xl px-5 py-16">
          <span className="eyebrow mb-5">⚡ LIGHTNING TALK</span>
          <h1 className="mb-4 font-display text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
            LT会を
            <br />
            <span className="text-primary drop-shadow-[0_2px_12px_rgba(245,200,0,0.35)]">もっと気軽に</span>
            <br />
            始めよう
          </h1>
          <p className="mb-7 max-w-md text-base leading-relaxed text-muted-foreground">
            発表者が内容と候補日を登録して、参加者は○△×で回答するだけ。主催者が日程を確定したら Discord へ自動通知。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link href="/events/new" className="btn-primary">
                ⚡ LT会を作る
              </Link>
            ) : (
              <Link href="/register" className="btn-primary">
                ⚡ 登録してLT会を作る
              </Link>
            )}
            <span className="text-sm text-subtle">回答は共有URLからログイン不要でできます</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-6 px-5 py-3.5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-black text-primary-foreground">{stat.value}</span>
              <span className="font-display text-xs font-bold text-primary-foreground/60">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-5 py-10">
        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold text-foreground">回答受付中</h2>
            <span className="badge bg-secondary text-secondary-foreground">{open.length} 件</span>
          </div>
          {open.length === 0 ? (
            <div className="card text-center text-muted-foreground">
              <p>調整中のLT会はありません。</p>
              {!user && (
                <p className="mt-2 text-sm">
                  <Link href="/register" className="font-semibold text-secondary-foreground underline">
                    登録
                  </Link>
                  してLT会を作ってみましょう。
                </p>
              )}
            </div>
          ) : (
            <div className="events-grid grid gap-4 sm:grid-cols-2">
              {open.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        {others.length > 0 && (
          <section>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-extrabold text-foreground">開催決定・終了</h2>
              <span className="badge bg-success-bg text-success-foreground">{others.length} 件</span>
            </div>
            <div className="events-grid grid gap-4 sm:grid-cols-2">
              {others.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
