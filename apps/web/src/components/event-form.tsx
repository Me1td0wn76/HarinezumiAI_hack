"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { createEvent } from "@/actions/events";
import { CandidateDatesField } from "./candidate-dates-field";
import { WebhookUrlField } from "./webhook-url-field";
import { FormMessage } from "./form-message";

/**
 * フォームの見出し付きカード枠。
 * @param title カード上部に表示する見出し文字列（絵文字付きラベル）
 * @param children カード内に並べるフィールド群
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-4">
      <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function EventForm() {
  const [state, action, pending] = useActionState(createEvent, undefined);

  return (
    <form action={action} className="space-y-5">
      <Section title="📋 基本情報">
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
      </Section>

      <Section title="🗓 候補日">
        <p className="-mt-2 text-xs text-subtle">終了時刻は任意です</p>
        <CandidateDatesField min={1} />
      </Section>

      <Section title="🔔 通知">
        <WebhookUrlField id="webhookUrl" />
      </Section>

      <FormMessage state={state} />
      <button type="submit" className="btn-primary w-full justify-center text-base" disabled={pending}>
        {pending ? "作成中…" : "⚡ LT会を作成する"}
      </button>
    </form>
  );
}
