import { EventForm } from "@/components/event-form";
import { CreateHeroShapes } from "@/components/create-progress";
import { requireUser } from "@/lib/auth";
import { getMyOrganizations } from "@/lib/organizations";

export default async function NewEventPage() {
  const [, organizations] = await Promise.all([requireUser(), getMyOrganizations()]);
  return (
    <>
      {/*
        見出しだけを「LT会を作る」の色（HOME の箱・画面切り替えの幕と同じピーチ）の帯にし、
        「LT会を探す」と同じくカーソルに合わせて動く図形を置く（白い丸が見えるよう、帯の上に置く）
      */}
      <section className="relative overflow-hidden bg-peach">
        {/* 稲妻はフォームの入力が進むほどオレンジに満ちる */}
        <CreateHeroShapes />
        {/* 稲妻（高さ約 180px）が動いても帯の下で切れないよう、帯の高さを「LT会を探す」と同じくらいにする */}
        <div className="relative mx-auto max-w-5xl space-y-3 px-4 pt-12 pb-16">
          {/* ラベルも帯と同じピーチにする（白だと帯の中で浮くため） */}
          <span className="eyebrow bg-peach">⚡ NEW EVENT</span>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground">LT会を作ろう</h1>
          <p className="text-sm text-foreground/80">
            発表内容と開催候補日を登録すると、参加者が候補日ごとに参加可否を回答できるようになります。
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <EventForm organizations={organizations} />
      </div>
    </>
  );
}
