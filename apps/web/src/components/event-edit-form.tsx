"use client";

import type { EventDetailDto } from "@lt/shared";
import Link from "next/link";
import { useActionState } from "react";
import { updateEvent } from "@/actions/events";
import { FormMessage } from "./form-message";
import { FormatFields } from "./format-fields";
import { TagsField } from "./tags-field";

/**
 * 主催者がタイトル・発表内容・タグ・開催形式（会場 / 配信URL）を編集する。
 * 候補日の追加・削除と Discord 通知の設定は主催者メニューで行う
 */
export function EventEditForm({
  event,
}: {
  event: Pick<EventDetailDto, "id" | "title" | "description" | "tags" | "format" | "venue" | "meetingUrl">;
}) {
  const [state, action, pending] = useActionState(updateEvent, undefined);

  return (
    <form action={action} className="card space-y-4">
      <input type="hidden" name="eventId" value={event.id} />
      <div>
        <label className="label" htmlFor="title">
          タイトル
        </label>
        <input id="title" name="title" className="input" required maxLength={100} defaultValue={event.title} />
      </div>
      <div>
        <label className="label" htmlFor="description">
          発表内容
        </label>
        <textarea
          id="description"
          name="description"
          className="input"
          rows={8}
          maxLength={5000}
          defaultValue={event.description}
        />
      </div>
      <TagsField defaultTags={event.tags} />
      <FormatFields initialFormat={event.format} defaultVenue={event.venue} defaultMeetingUrl={event.meetingUrl} />
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "保存中…" : "保存する"}
        </button>
        <Link href={`/events/${event.id}`} className="btn-secondary">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
