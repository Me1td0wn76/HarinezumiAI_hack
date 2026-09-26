import type { Metadata } from "next";
import { ORGANIZATION_ROLE_LABEL, type EventSummaryDto, type PageDto } from "@lt/shared";
import { notFound, permanentRedirect } from "next/navigation";
import { EventList } from "@/components/event-list";
import {
  AddMemberForm,
  DeleteOrganizationButton,
  LeaveButton,
  MemberActions,
} from "@/components/organization-member-controls";
import { OrganizationForm } from "@/components/organization-form";
import { UserLink } from "@/components/user-link";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getOrganization } from "@/lib/organizations";

/**
 * URL の slug（小文字）。/orgs/My-Lab のような URL は正規の小文字の URL へ移動させる。
 * generateMetadata とページは並行して動くので、両方で呼ぶ
 */
function canonicalSlug(raw: string): string {
  const slug = raw.toLowerCase();
  if (raw !== slug) permanentRedirect(`/orgs/${slug}`);
  return slug;
}

export async function generateMetadata(props: PageProps<"/orgs/[slug]">): Promise<Metadata> {
  const org = await getOrganization(canonicalSlug((await props.params).slug));
  const description = org.description ?? `${org.name} のLT会`;
  return { title: org.name, description, openGraph: { title: org.name, description, url: `/orgs/${org.slug}` } };
}

/** 団体ページ。紹介・メンバー・団体のLT会。OWNER には編集・メンバー管理を出す */
export default async function OrganizationPage(props: PageProps<"/orgs/[slug]">) {
  const slug = canonicalSlug((await props.params).slug);
  const query = { organization: slug };
  // org は generateMetadata と同じ関数なので React.cache で 1 回しか取得されない。
  // 一覧は「もっと見る」（loadMoreEvents）やトップページと揃えて auth: false で取る（ページによって出るLT会が変わらないように）。
  // 存在しない団体では org 側より先に一覧の 404 が返ることがあるので、こちらも notFound にする
  const [org, events, viewer] = await Promise.all([
    getOrganization(slug),
    apiFetch<PageDto<EventSummaryDto>>(`/organizations/${slug}/events`, { auth: false }).catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) notFound();
      throw err;
    }),
    getCurrentUser(),
  ]);
  const isOwner = org.viewerRole === "OWNER";

  // layout.tsx の <main> は余白を持たないため、ページ側でコンテナを持つ
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <header className="card space-y-3">
        <span className="eyebrow">👥 ORGANIZATION</span>
        <h1 className="break-words font-display text-3xl font-black tracking-tight text-foreground">{org.name}</h1>
        <p className="text-sm text-subtle">
          <span translate="no">/orgs/{org.slug}</span> ・ メンバー {org.memberCount} 人 ・{" "}
          <time dateTime={org.createdAt}>{formatDate(org.createdAt)}</time> に作成
        </p>
        {org.description && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{org.description}</p>}
        {org.viewerRole && (
          <p className="text-xs text-muted-foreground">
            あなたはこの団体の{ORGANIZATION_ROLE_LABEL[org.viewerRole]}です。LT会を作るときにこの団体を選べます。
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold text-foreground">この団体のLT会</h2>
        <EventList key={slug} initial={events} query={query} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold text-foreground">メンバー</h2>
        <ul className="card divide-y divide-card-border py-2">
          {org.members.map((m) => (
            <li key={m.user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <UserLink user={m.user} />
                {m.role === "OWNER" && (
                  <span className="badge bg-secondary text-secondary-foreground">{ORGANIZATION_ROLE_LABEL.OWNER}</span>
                )}
              </div>
              {isOwner && m.user.id !== viewer?.id ? (
                <MemberActions slug={org.slug} userId={m.user.id} displayName={m.user.displayName} role={m.role} />
              ) : null}
            </li>
          ))}
        </ul>
        {org.viewerRole && viewer ? <LeaveButton slug={org.slug} userId={viewer.id} name={org.name} /> : null}
      </section>

      {isOwner && (
        <section className="card space-y-6 border-primary">
          <div className="flex items-center gap-2">
            <span className="eyebrow">⚡ OWNER</span>
            <h2 className="font-display font-extrabold text-foreground">オーナーメニュー</h2>
          </div>
          <AddMemberForm slug={org.slug} />
          <div className="border-t border-card-border pt-4">
            <p className="label">団体の情報</p>
            <OrganizationForm organization={org} />
          </div>
          <div className="border-t border-card-border pt-4">
            <p className="label">団体の管理</p>
            <DeleteOrganizationButton slug={org.slug} name={org.name} />
          </div>
        </section>
      )}
    </div>
  );
}
