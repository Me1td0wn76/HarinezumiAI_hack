import { EVENT_STATUS_LABEL, type EventStatus } from "@lt/shared";

/** ステータスバッジの配色。EventStatus の値ごとに切り替える */
const styles: Record<EventStatus, string> = {
  OPEN: "bg-secondary text-secondary-foreground",
  CONFIRMED: "bg-success-bg text-success-foreground",
  CLOSED: "bg-muted text-muted-foreground",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <span className={`badge ${styles[status]}`}>{EVENT_STATUS_LABEL[status]}</span>;
}
