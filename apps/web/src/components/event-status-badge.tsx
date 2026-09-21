import { EVENT_STATUS_LABEL, type EventStatus } from "@lt/shared";

const styles: Record<EventStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-stone-200 text-stone-600",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <span className={`badge ${styles[status]}`}>{EVENT_STATUS_LABEL[status]}</span>;
}
