"use client";

import { EVENT_FORMAT_LABEL, type EventFormat, type OrganizationSummaryDto } from "@lt/shared";
import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { createEvent } from "@/actions/events";
import { keepValuesOnSubmit } from "@/lib/keep-values-on-submit";
import { CandidateDatesField } from "./candidate-dates-field";
import { CREATE_STEPS, setCreateProgress } from "./create-progress";
import { FleeingShapes } from "./fleeing-shapes";
import { WebhookUrlField } from "./webhook-url-field";
import { FormMessage } from "./form-message";
import { FormatFields } from "./format-fields";
import { OrganizationSelect } from "./organization-select";
import { TagsField } from "./tags-field";

/**
 * フォームの見出し付きのまとまり（LT会の詳細ページと同じく、枠を付けずに大きな見出しで区切る）。
 * 左に番号を置き、入力が済んだらチェックに変える（番号は飾りで、済んだかどうかは右の欄の文字でも伝える）
 * @param num 左に出す番号
 * @param done 入力が済んだか。undefined なら任意の項目で、チェックにしない
 */
function Section({ title, num, done, children }: { title: string; num: number; done?: boolean; children: ReactNode }) {
  return (
    <section className="relative space-y-4">
      <span
        aria-hidden="true"
        data-done={done || undefined}
        className={`lt-step absolute top-0 -left-12 flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-sm font-black ${
          done ? "border-accent-strong bg-accent" : "border-primary bg-white"
        }`}
      >
        {done ? "✓" : num}
      </span>
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-black tracking-tight text-foreground">{title}</h2>
        {done === undefined && <span className="text-sm font-bold text-muted-foreground">任意</span>}
        <FleeingShapes size="small" className="mr-4 ml-auto" />
      </div>
      {children}
    </section>
  );
}

interface Summary {
  title: string;
  organization: string;
  description: string;
  format: EventFormat;
  venue: string;
  dates: string[];
  tags: string[];
}

// 開催形式は FormatFields の初期値（オンライン）に合わせる
const EMPTY: Summary = { title: "", organization: "", description: "", format: "ONLINE", venue: "", dates: [], tags: [] };

/** "2026-10-10T19:00"（datetime-local の値）→ "10/10 19:00" */
function shortLocal(value: string): string {
  const [date, time] = value.split("T");
  const [, m, d] = date.split("-").map(Number);
  return `${m}/${d} ${time ?? ""}`.trim();
}

/** "2026-10-10T19:00" → "10.10"（HOME の「近日開催のLT会」のカードと同じ書き方） */
function cardDate(value: string): string {
  const [, m, d] = value.split("T")[0].split("-").map(Number);
  return `${m}.${d}`;
}

/** 入力中のフォームから、右の欄に出す値を読み取る */
function readSummary(form: HTMLFormElement): Summary {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "").trim();
  return {
    title: text("title"),
    organization: text("organizationId"),
    description: text("description"),
    format: (text("format") || "ONLINE") as EventFormat,
    venue: text("venue"),
    dates: data.getAll("startsAt").map(String).filter(Boolean).sort(),
    // 区切り方は TagsField の説明（カンマか空白）に合わせる
    tags: text("tags")
      .split(/[,、\s]+/)
      .filter(Boolean)
      .slice(0, 5),
  };
}

/**
 * 上から順に済んだ区切りの数（基本情報 → 開催形式 → 候補日）。前の区切りが済むまで、次は済んでいても数えない。
 * 左の番号・縦の線・右の欄のチェック・上の帯の稲妻は、すべてこの数でそろえる
 */
function countSteps(summary: Summary): number {
  const done = [summary.title !== "", summary.format === "ONLINE" || summary.venue !== "", summary.dates.length > 0];
  const firstTodo = done.findIndex((d) => !d);
  return firstTodo === -1 ? CREATE_STEPS : firstTodo;
}

function Row({ label, ok, children }: { label: string; ok: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          ok ? "border-accent-strong bg-accent" : "border-primary bg-white"
        }`}
      >
        {ok && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        )}
      </span>
      <span className="min-w-0 space-y-0.5">
        <span className="block text-xs font-bold text-muted-foreground">{label}</span>
        <span className="block font-display text-sm font-black [overflow-wrap:anywhere]">{children}</span>
      </span>
    </li>
  );
}

/** @param organizations 自分が所属する団体。LT会を紐付ける選択肢になる */
export function EventForm({ organizations }: { organizations: OrganizationSummaryDto[] }) {
  const [state, action, pending] = useActionState(createEvent, undefined);
  const [summary, setSummary] = useState<Summary>(EMPTY);
  const frame = useRef(0);

  // 入力・選択・候補日の追加/削除（クリック）・送信後のリセットのたびに、描画が済んでから読み直す
  const refresh = useCallback((form: HTMLFormElement) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const next = readSummary(form);
      setSummary(next);
      // 上の帯の稲妻に進み具合を渡す（左の番号と同じ数）
      setCreateProgress(countSteps(next));
    });
  }, []);

  // ページを離れたら稲妻を空に戻す（次に開いたときに前の入力の分が残らないように）
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      setCreateProgress(0);
    },
    [],
  );

  const datesDone = summary.dates.length > 0;
  const doneCount = countSteps(summary);
  const formatLabel = EVENT_FORMAT_LABEL[summary.format] ?? EVENT_FORMAT_LABEL.ONLINE;
  const organizationName = organizations.find((o) => o.id === summary.organization)?.name;

  return (
    <form
      action={action}
      // エラー（レート制限・入力の不備など）が返っても入力が消えないよう、送信を引き取る（成功時は詳細ページへ移る）
      onSubmit={keepValuesOnSubmit(action)}
      onInput={(e) => refresh(e.currentTarget)}
      onChange={(e) => refresh(e.currentTarget)}
      onClick={(e) => refresh(e.currentTarget)}
      onReset={(e) => refresh(e.currentTarget)}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start"
    >
      {/* 左の番号の分だけ内側に寄せ、番号どうしを縦の線でつなぐ。線は済んだ区切りの分だけオレンジに伸びる */}
      <div className="relative min-w-0 space-y-10 pl-12">
        <div aria-hidden="true" className="absolute top-4 bottom-4 left-[14px] w-1 rounded-full bg-muted">
          <div className="lt-step-line w-1 rounded-full bg-accent" style={{ height: `${(doneCount / CREATE_STEPS) * 100}%` }} />
        </div>

        <Section title="基本情報" num={1} done={doneCount >= 1}>
          <div>
            <label className="label" htmlFor="title">
              タイトル
            </label>
            <input id="title" name="title" className="input" required maxLength={100} placeholder="第3回 LT会" />
          </div>
          <div>
            <label className="label" htmlFor="description">
              発表内容
            </label>
            <textarea
              id="description"
              name="description"
              className="input"
              rows={5}
              maxLength={5000}
              placeholder="発表テーマや持ち時間、参加者へのメッセージなど"
            />
          </div>
          <TagsField />
          <OrganizationSelect organizations={organizations} />
        </Section>

        <Section title="開催形式" num={2} done={doneCount >= 2}>
          <FormatFields />
        </Section>

        <Section title="候補日" num={3} done={doneCount >= 3}>
          <p className="-mt-2 text-sm text-muted-foreground">終了時刻は任意です</p>
          <CandidateDatesField min={1} />
        </Section>

        <Section title="通知" num={4}>
          <WebhookUrlField id="webhookUrl" />
        </Section>
      </div>

      {/*
        右の欄: できあがりイメージ・入力の確認・作成ボタン。PC ではスクロールしても付いてくる（スマホではフォームの最後）。
        欄の高さは約 660px あるので、画面の高さが足りないとき（768px 未満）は付いてこさせない（作成ボタンが画面の下で切れたままになるため）
      */}
      <aside
        aria-labelledby="create-heading"
        className="space-y-5 rounded-[1.75rem] bg-card p-6 lg:[@media(min-height:48rem)]:sticky lg:[@media(min-height:48rem)]:top-6"
      >
        <h2 id="create-heading" className="font-display text-2xl font-black tracking-tight">
          LT会を公開する
        </h2>

        {/* HOME の「近日開催のLT会」と同じカード。card-hover なのでマウスで傾く */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">できあがりイメージ（HOME での見え方）</p>
          <div aria-hidden="true" className="card card-hover flex flex-col gap-2 bg-white shadow-[0_10px_24px_rgba(224,122,31,0.16)]">
            <span className="flex items-center gap-2 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-accent" />
              日程調整中・{formatLabel}
            </span>
            <span className="font-display text-3xl font-black text-accent-strong">
              {summary.dates[0] ? cardDate(summary.dates[0]) : "--.--"}
              <span className="ml-1 text-lg">〜</span>
            </span>
            {organizationName && <span className="text-xs font-bold text-muted-foreground">{organizationName}</span>}
            <span className={`font-display text-lg leading-snug font-black [overflow-wrap:anywhere] ${summary.title ? "" : "text-subtle"}`}>
              {summary.title || "タイトルを入れるとここに出ます"}
            </span>
            {summary.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {summary.tags.map((t) => (
                  <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">
                    #{t}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* 左の番号と同じ順に並べ、チェックも同じく上から順に付ける */}
        <ul className="space-y-3">
          <Row label="タイトル（必須）" ok={doneCount >= 1}>
            {summary.title || "未入力"}
          </Row>
          <Row label="開催形式" ok={doneCount >= 2}>
            {formatLabel}
            {summary.format !== "ONLINE" && (summary.venue ? `（${summary.venue}）` : "（会場は未入力）")}
          </Row>
          <Row label="候補日（1件以上）" ok={doneCount >= 3}>
            {datesDone
              ? `${summary.dates.length}件: ${summary.dates.slice(0, 3).map(shortLocal).join("・")}${summary.dates.length > 3 ? " ほか" : ""}`
              : "未入力"}
          </Row>
        </ul>
        <p className="rounded-xl bg-white px-4 py-3 text-sm leading-relaxed">
          作成すると公開され、参加者が候補日ごとに ○△× で回答できるようになります。作成後も内容の編集や候補日の追加ができます。
        </p>
        <FormMessage state={state} />
        <button type="submit" className="btn-primary w-full justify-center text-base" disabled={pending}>
          {pending ? "作成中…" : "⚡ LT会を作成する"}
        </button>
      </aside>
    </form>
  );
}
