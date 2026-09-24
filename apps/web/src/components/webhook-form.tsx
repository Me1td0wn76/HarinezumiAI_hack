"use client";

import { useActionState } from "react";
import { updateWebhook } from "@/actions/events";
import { FormMessage } from "./form-message";
import { WebhookUrlField } from "./webhook-url-field";

/** 主催者メニュー: LT会ごとの Discord 通知先 */
export function WebhookForm({ eventId, webhookUrl }: { eventId: string; webhookUrl: string | null }) {
  const [state, action, pending] = useActionState(updateWebhook, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <WebhookUrlField id="organizer-webhook-url" defaultValue={webhookUrl} />
      <FormMessage state={state} successText="通知先を保存しました" />
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "保存中…" : "保存する"}
      </button>
    </form>
  );
}
