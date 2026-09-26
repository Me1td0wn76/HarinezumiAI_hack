import type { EventDetailDto } from "@lt/shared";
import { notFound, redirect } from "next/navigation";
import { EventEditForm } from "@/components/event-edit-form";
import { ApiError, apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getMyOrganizations } from "@/lib/organizations";

export default async function EditEventPage(props: PageProps<"/events/[id]/edit">) {
  const { id } = await props.params;
  const [user, organizations] = await Promise.all([requireUser(), getMyOrganizations()]);

  let detail: EventDetailDto;
  try {
    detail = await apiFetch<EventDetailDto>(`/events/${id}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
  // 主催者以外は詳細ページへ戻す（API 側でも 403 になる）
  if (detail.organizer.id !== user.id) redirect(`/events/${id}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <span className="eyebrow">⚡ EDIT EVENT</span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">LT会を編集</h1>
      </div>
      <EventEditForm event={detail} organizations={organizations} />
    </div>
  );
}
