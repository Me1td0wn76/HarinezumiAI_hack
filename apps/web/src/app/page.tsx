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
  // 統計バーに表示する4項目。EventSummaryDto から取得済みのデータだけで集計する（追加のAPI呼び出しはしない）。
  // 「回答数」は responderCount の単純合計。同じ人が複数のLT会に回答すると重複してカウントされるため
  // （サマリーDTOにはユーザー単位で重複排除する情報がない）、「回答者」ではなく「回答数」と表記する
  const stats = [
    { label: "LT会", value: events.length },
    { label: "候補日", value: events.reduce((s, e) => s + e.candidateDateCount, 0) },
    { label: "回答数", value: events.reduce((s, e) => s + e.responderCount, 0) },
    { label: "開催確定", value: confirmed.length },
  ];

  return (
    <>
      {/*
        Hero: layout.tsx の <main> は余白を持たないので、この section 自体が画面幅いっぱいに広がる。
        中の文字だけ mx-auto max-w-4xl px-4 で中央寄せする（px-4 は Nav のロゴと同じ左端に揃えるため）
      */}
      <section className="border-b border-card-border bg-linear-160 from-secondary/40 to-background">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <span className="eyebrow mb-5">⚡ LIGHTNING TALK</span>
          <h1 className="mb-4 font-display text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
            LT会を
            <br />
            {/* 黄色い文字色は背景とのコントラストがWCAG AA基準(3:1)を満たせないため、
                文字色ではなく背景を黄色にした「マーカーで線を引く」表現に変更 */}
            <span className="rounded-lg bg-primary px-2 text-foreground">もっと気軽に</span>
            <br />
            始めよう
          </h1>
          {/* 「Discordへ自動通知」の一文は削除:
              Discord Webhookは運営が環境変数(DISCORD_WEBHOOK_URL)で設定する1本だけで、
              主催者ごとに通知先を設定するUIは存在しない（Issue #12）。誤解を招くため落とした */}
          <p className="mb-7 max-w-md text-base leading-relaxed text-muted-foreground">
            発表者が内容と候補日を登録して、参加者は○△×で回答するだけ。
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
        <div className="mx-auto flex max-w-4xl flex-wrap gap-6 px-4 py-3.5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-black text-primary-foreground">{stat.value}</span>
              {/* /60 だと text-xs bold でWCAG AA(4.5:1)を割るため /70 に強める */}
              <span className="font-display text-xs font-bold text-primary-foreground/70">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-10">
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
            <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="grid gap-4 sm:grid-cols-2">
              {others.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
