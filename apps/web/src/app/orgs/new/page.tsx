import type { Metadata } from "next";
import { OrganizationForm } from "@/components/organization-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "団体を作る" };

export default async function NewOrganizationPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <span className="eyebrow">👥 NEW ORGANIZATION</span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">団体を作ろう</h1>
        <p className="text-sm text-muted-foreground">
          作成したあなたがオーナーになります。団体は招待制で、メンバーはオーナーがハンドルを指定して追加します。
        </p>
      </div>
      <section className="card">
        <OrganizationForm />
      </section>
    </div>
  );
}
