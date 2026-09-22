import { EVENT_FORMAT_LABEL, type EventDetailDto } from "@lt/shared";
import { EventFormatBadge } from "./event-format-badge";

/**
 * 開催形式・会場・配信URL のまとまり。
 * 配信URL は API 側で閲覧者に応じて出し分け済み（主催者 / 開催日決定後の回答者のみ）。
 * @param reveal ゲスト用など、URL を別途取得して差し込む場合に渡す
 */
export function EventPlace({ detail, reveal }: { detail: EventDetailDto; reveal?: React.ReactNode }) {
  const meetingUrl = detail.meetingUrl;
  const urlPending = !meetingUrl && detail.hasMeetingUrl;
  return (
    <section className="card space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <h2 className="font-medium text-stone-500">開催形式</h2>
        <EventFormatBadge format={detail.format} />
      </div>
      {detail.venue ? (
        <p>
          <span className="text-stone-500">会場: </span>
          {detail.venue}
        </p>
      ) : null}
      {meetingUrl ? (
        <p>
          <span className="text-stone-500">配信URL: </span>
          <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 underline">
            {meetingUrl}
          </a>
        </p>
      ) : urlPending ? (
        reveal ?? (
          <p className="text-stone-500">
            配信URLは{detail.status === "CONFIRMED" ? "回答した人にのみ表示されます" : "開催日決定後、回答した人に表示されます"}。
          </p>
        )
      ) : detail.format !== "OFFLINE" ? (
        <p className="text-stone-400">配信URLは未設定です（{EVENT_FORMAT_LABEL[detail.format]}）</p>
      ) : null}
    </section>
  );
}
