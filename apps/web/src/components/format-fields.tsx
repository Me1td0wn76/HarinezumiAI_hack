"use client";

import { EVENT_FORMAT, EVENT_FORMAT_LABEL, type EventFormat } from "@lt/shared";
import { useState } from "react";

/**
 * 開催形式の選択と、形式に応じた会場 / 配信URL の入力欄。
 * name は format / venue / meetingUrl（actions/events.ts の createEvent / updateEvent と対応）
 */
export function FormatFields({
  initialFormat = "ONLINE",
  defaultVenue,
  defaultMeetingUrl,
}: {
  initialFormat?: EventFormat;
  /** 編集時の現在値 */
  defaultVenue?: string | null;
  defaultMeetingUrl?: string | null;
}) {
  const [format, setFormat] = useState<EventFormat>(initialFormat);
  const showVenue = format !== "ONLINE";
  const showUrl = format !== "OFFLINE";

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="label">開催形式</legend>
        <div className="flex flex-wrap gap-2">
          {EVENT_FORMAT.map((f) => (
            <label key={f} className="cursor-pointer">
              <input
                type="radio"
                name="format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border-[1.5px] border-border-strong px-3.5 py-1.5 font-display text-sm font-bold text-muted-foreground transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30">
                {EVENT_FORMAT_LABEL[f]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {showVenue ? (
        <div>
          <label className="label" htmlFor="venue">
            会場（名称・住所）
          </label>
          <input
            id="venue"
            name="venue"
            className="input"
            maxLength={200}
            placeholder="東京都渋谷区 ○○ビル 3F 会議室"
            defaultValue={defaultVenue ?? undefined}
          />
        </div>
      ) : null}
      {showUrl ? (
        <div>
          <label className="label" htmlFor="meetingUrl">
            配信URL（任意）
          </label>
          <input
            id="meetingUrl"
            name="meetingUrl"
            type="url"
            className="input"
            maxLength={500}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            defaultValue={defaultMeetingUrl ?? undefined}
          />
          <p className="mt-1 text-xs text-subtle">開催日を決定するまで参加者には表示されません。決定後、回答した人だけに表示されます。</p>
        </div>
      ) : null}
    </div>
  );
}
