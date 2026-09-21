import { EventForm } from "@/components/event-form";
import { requireUser } from "@/lib/auth";

export default async function NewEventPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">LT会を作る</h1>
      <p className="text-sm text-stone-600">
        発表内容と開催候補日を登録すると、参加者が候補日ごとに参加可否を回答できるようになります。
      </p>
      <EventForm />
    </div>
  );
}
