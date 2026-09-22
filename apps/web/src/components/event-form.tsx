"use client";

import { TAG_MAX_LENGTH, TAG_MAX_PER_EVENT } from "@lt/shared";
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
        <label className="label" htmlFor="tags">
          タグ（任意・{TAG_MAX_PER_EVENT}つまで）
        </label>
        <input
          id="tags"
          name="tags"
          className="input"
          placeholder="web, typescript, 初心者歓迎"
          maxLength={(TAG_MAX_LENGTH + 2) * TAG_MAX_PER_EVENT}
        />
        <p className="mt-1 text-xs text-stone-500">カンマか空白で区切ります。興味のある人に見つけてもらいやすくなります。</p>
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
