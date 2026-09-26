import type { Metadata } from "next";
import type { OrganizationListItemDto } from "@lt/shared";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getMyOrganizations } from "@/lib/organizations";

export const metadata: Metadata = { title: "団体" };

/** 団体の一覧（新しい順）と、ログイン中なら自分の所属団体 */
export default async function OrganizationsPage() {
  const [organizations, mine, user] = await Promise.all([
    apiFetch<OrganizationListItemDto[]>("/organizations", { auth: false }),
    getMyOrganizations(),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="eyebrow">👥 ORGANIZATIONS</span>
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground">団体</h1>
          <p className="text-sm text-muted-foreground">サークルや研究室ごとに、LT会をまとめて見られます。</p>
        </div>
        {user ? (
          <Link href="/orgs/new" className="btn-primary">
            団体を作る
          </Link>
        ) : null}
      </div>

      {mine.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-extrabold text-foreground">所属している団体</h2>
          <ul className="flex flex-wrap gap-2">
            {mine.map((o) => (
              <li key={o.id}>
                <Link href={`/orgs/${o.slug}`} className="badge border-[1.5px] border-border bg-card text-foreground hover:border-primary">
                  {o.name}
                  {o.role === "OWNER" ? <span className="text-subtle">（オーナー）</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold text-foreground">新しい団体</h2>
        {organizations.length === 0 ? (
          <p className="card text-center text-sm text-muted-foreground">まだ団体はありません。</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {organizations.map((o) => (
              <li key={o.id}>
                <Link href={`/orgs/${o.slug}`} className="card block h-full transition hover:-translate-y-1">
                  <h3 className="break-words font-display text-lg font-extrabold text-foreground">{o.name}</h3>
                  <p className="text-xs text-subtle" translate="no">
                    /orgs/{o.slug} ・ メンバー {o.memberCount} 人
                  </p>
                  {o.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
