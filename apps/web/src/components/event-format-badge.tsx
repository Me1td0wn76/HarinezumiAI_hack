import { EVENT_FORMAT_LABEL, type EventFormat } from "@lt/shared";

const styles: Record<EventFormat, string> = {
  ONLINE: "bg-sky-100 text-sky-800",
  OFFLINE: "bg-orange-100 text-orange-800",
  HYBRID: "bg-violet-100 text-violet-800",
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
