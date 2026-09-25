import { EVENT_FORMAT_LABEL, type EventFormat } from "@lt/shared";

/* デザイントークンに形式別の色は無いので、ステータス色と被らない落ち着いた配色を直接指定する */
const styles: Record<EventFormat, string> = {
  ONLINE: "bg-sky-100 text-sky-900",
  OFFLINE: "bg-orange-100 text-orange-900",
  HYBRID: "bg-violet-100 text-violet-900",
};

const icons: Record<EventFormat, string> = {
  ONLINE: "💻",
  OFFLINE: "📍",
  HYBRID: "💻📍",
};

export function EventFormatBadge({ format }: { format: EventFormat }) {
  return (
    <span className={`badge ${styles[format]}`}>
      <span aria-hidden="true">{icons[format]} </span>
      {EVENT_FORMAT_LABEL[format]}
    </span>
  );
}
