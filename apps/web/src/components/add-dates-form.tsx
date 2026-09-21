"use client";

import { useActionState } from "react";
import { addDates } from "@/actions/events";
import { CandidateDatesField } from "./candidate-dates-field";
import { FormMessage } from "./form-message";

/** 主催者が後から候補日を追加する */
export function AddDatesForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(addDates, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <CandidateDatesField min={1} />
      <FormMessage state={state} successText="候補日を追加しました" />
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "追加中…" : "候補日を追加"}
      </button>
    </form>
  );
}
