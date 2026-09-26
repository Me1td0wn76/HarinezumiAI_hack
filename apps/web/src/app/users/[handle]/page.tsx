import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { BlockButton } from "@/components/block-button";
import { EventSection } from "@/components/event-section";
import { FollowButton } from "@/components/follow-button";
import { getCurrentUser, getMyBlocks } from "@/lib/auth";
import { canonicalLowercaseParam } from "@/lib/canonical-param";
import { formatDate } from "@/lib/format";
import { getUserProfile } from "@/lib/users";

/** URL のハンドル（小文字）。/users/me は編集ページへ、大文字を含む URL は小文字の URL へ移動させる */
function canonicalHandle(raw: string): string {
  if (raw.toLowerCase() === "me") redirect("/me");
  return canonicalLowercaseParam(raw, "/users");
}

export async function generateMetadata(props: PageProps<"/users/[handle]">): Promise<Metadata> {
  const handle = canonicalHandle((await props.params).handle);
  const { user } = await getUserProfile(handle);
  const title = `${user.displayName}（@${user.handle}）`;
  const description = user.bio ?? `${user.displayName} さんが主催・参加するLT会`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile", url: `/users/${user.handle}` },
  };
}

/** 公開プロフィール。自己紹介・主催したLT会・参加予定。メールアドレスは API が返さない */
export default async function UserProfilePage(props: PageProps<"/users/[handle]">) {
  const handle = canonicalHandle((await props.params).handle);

  // profile は generateMetadata と同じ関数なので React.cache で 1 回しか取得されない
  const [profile, viewer, blocks] = await Promise.all([getUserProfile(handle), getCurrentUser(), getMyBlocks()]);
  const { user, organized, upcoming } = profile;
  const isMe = viewer?.id === user.id;
  const blocked = blocks.some((b) => b.id === user.id);

  // layout.tsx の <main> は余白を持たないため、ページ側でコンテナを持つ
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <header className="card flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar user={user} size={96} preload />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 className="break-words font-display text-2xl font-black text-foreground">{user.displayName}</h1>
            <p className="text-sm text-subtle" translate="no">
              @{user.handle}
            </p>
          </div>
          {user.bio && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{user.bio}</p>}
          <p className="text-sm text-muted-foreground">
            フォロワー <span className="font-bold text-foreground">{profile.followerCount}</span> ・ フォロー中{" "}
            <span className="font-bold text-foreground">{profile.followingCount}</span>
          </p>
          <p className="text-xs text-subtle">
            <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time> に登録
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {isMe ? (
            <Link href="/me" className="btn-secondary text-xs">
              プロフィールを編集
            </Link>
          ) : viewer ? (
            <>
              <FollowButton targetUserId={user.id} initialIsFollowing={profile.isFollowing} />
              <BlockButton userId={user.id} displayName={user.displayName} blocked={blocked} />
            </>
          ) : (
            <p className="text-xs text-subtle">
              フォローするには
              <Link href="/login" className="text-secondary-foreground underline">
                ログイン
              </Link>
              してください
            </p>
          )}
        </div>
      </header>

      {blocked && (
        <p role="status" className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          ブロック中のユーザーです。このユーザーが主催するLT会は表示されません。
        </p>
      )}

      <EventSection
        title="参加予定のLT会"
        events={upcoming}
        empty="日程調整中・開催前のLT会はありません。"
      />
      <EventSection title="主催したLT会" events={organized} empty="まだ主催したLT会はありません。" />
    </div>
  );
}
