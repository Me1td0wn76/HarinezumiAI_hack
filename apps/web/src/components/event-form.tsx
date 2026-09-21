"use client";

import { useActionState } from "react";
import { createEvent } from "@/actions/events";
import { CandidateDatesField } from "./candidate-dates-field";
import { FormMessage } from "./form-message";

export function EventForm() {
  const [state, action, pending] = useActionState(createEvent, undefined);

  return (
    <form action={action} className="card space-y-5">
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
      <div>
        <p className="label">開催候補日（終了時刻は任意）</p>
        <CandidateDatesField min={1} />
      </div>
      <FormMessage state={state} />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "作成中…" : "LT会を作成する"}
      </button>
    </form>
  );
}
