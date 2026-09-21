"use client";

import type { EventDateDto, ResponderRowDto } from "@lt/shared";
import { useActionState } from "react";
import { submitResponses } from "@/actions/events";
import { FormMessage } from "./form-message";
import { ResponseFields } from "./response-fields";

/** ログインユーザー用の回答フォーム */
export function ResponseForm({
  eventId,
  candidateDates,
  initial,
}: {
  eventId: string;
  candidateDates: EventDateDto[];
  initial?: ResponderRowDto["answers"];
}) {
  const [state, action, pending] = useActionState(submitResponses, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <ResponseFields candidateDates={candidateDates} initial={initial} />
      <FormMessage state={state} successText="回答を保存しました" />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "送信中…" : initial ? "回答を更新する" : "回答する"}
      </button>
    </form>
  );
}
