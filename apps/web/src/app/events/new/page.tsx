import { EventForm } from "@/components/event-form";
import { requireUser } from "@/lib/auth";

export default async function NewEventPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <span className="eyebrow">⚡ NEW EVENT</span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">LT会を作ろう</h1>
        <p className="text-sm text-muted-foreground">
          発表内容と開催候補日を登録すると、参加者が候補日ごとに参加可否を回答できるようになります。
        </p>
      </div>
      <EventForm />
    </div>
  );
}
