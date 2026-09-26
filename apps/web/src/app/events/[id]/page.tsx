import { ENTRY_ROLE_LABEL, type EventCommentDto, type EventDetailDto, type PublicUserDto } from "@lt/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comment-section";
import { EntryForm, WithdrawEntryForm } from "@/components/entry-form";
import { EntryList } from "@/components/entry-list";
import { EventHeader } from "@/components/event-header";
import { EventPlace } from "@/components/event-place";
import { OrganizerPanel } from "@/components/organizer-panel";
import { ResponseForm } from "@/components/response-form";
import { ResponseGrid } from "@/components/response-grid";
import { SafetyMenu } from "@/components/safety-menu";
import { ShareButtons } from "@/components/share-buttons";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser, getMyBlocks } from "@/lib/auth";
import { eventShareText, getEventDetail, webUrl } from "@/lib/events";
import { eventDescription } from "@/lib/og-image";

/** 見つからない・不正な ID は 404 に寄せる */
async function loadDetail(id: string): Promise<EventDetailDto> {
  try {
    // Cookie のトークン付きで取得すると、主催者本人には shareToken が返る
    return await getEventDetail(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

/** OGP。X / LINE / Discord に貼ったときのカード表示に使われる */
export async function generateMetadata(props: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const detail = await loadDetail(id);
  const description = eventDescription(detail);
  return {
    title: detail.title,
    description,
    openGraph: { title: detail.title, description, type: "article", url: `/events/${id}` },
    twitter: { card: "summary_large_image", title: detail.title, description },
  };
}

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;

  // detail は generateMetadata と同じ関数なので React.cache で 1 回しか取得されない
  let detail: EventDetailDto;
  let comments: EventCommentDto[];
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  let blocks: PublicUserDto[];
  try {
    [detail, comments, user, blocks] = await Promise.all([
      loadDetail(id),
      apiFetch<EventCommentDto[]>(`/events/${id}/comments`),
      getCurrentUser(),
      getMyBlocks(),
    ]);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
  const isOrganizer = user?.id === detail.organizer.id;
  const myRow = user ? detail.responders.find((r) => r.responderKey === user.id) : undefined;
  // 主催者は参加表明しない（API も 400 を返す）。終了したLT会も受け付けない
  const canEnter = !isOrganizer && detail.status !== "CLOSED";
  const shareUrl = detail.shareToken ? webUrl(`/share/${detail.shareToken}`) : null;
  const shareText = eventShareText(detail);

  // layout.tsx の <main> は余白を持たないため、ページごとにコンテナ（中央寄せ・最大幅・左右上下の余白）を持つ
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* 非表示のLT会は主催者と運営にしか返らないので、見えている人に状態を知らせる */}
      {detail.hidden && (
        <p role="status" className="rounded-xl border border-danger bg-danger-bg px-4 py-3 text-sm text-danger-foreground">
          このLT会は運営により非表示になっています。一覧や共有URLからは閲覧できません。
        </p>
      )}
      <EventHeader
        title={detail.title}
        status={detail.status}
        organizer={detail.organizer}
        confirmedDate={detail.confirmedDate}
        tags={detail.tags}
      />
      {/* 参加表明の欄はページの下のほうにあるので、上部から飛べるようにする（主催者・終了したLT会では出さない） */}
      {canEnter && (
        <div className="flex flex-wrap items-center gap-3">
          {detail.myEntry ? (
            <>
              <span className="badge bg-secondary text-secondary-foreground">
                {ENTRY_ROLE_LABEL[detail.myEntry.role]}で参加表明済み
              </span>
              <a href="#entry" className="text-sm font-semibold text-secondary-foreground underline">
                参加表明を確認・変更する
              </a>
            </>
          ) : (
            <a href="#entry" className="btn-primary">
              <span aria-hidden="true">🙋</span> このLT会に参加する
            </a>
          )}
        </div>
      )}
      {/* 非表示のLT会は主催者と運営以外に見えないので、共有ボタンは出さない */}
      {!detail.hidden && <ShareButtons url={webUrl(`/events/${detail.id}`)} text={shareText} compact />}

      <EventPlace detail={detail} />

      {detail.description && (
        <section className="card">
          <h2 className="mb-2 font-display text-sm font-bold text-muted-foreground">発表内容</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.description}</p>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 font-display font-extrabold text-foreground">回答状況</h2>
        <ResponseGrid detail={detail} highlightKey={user?.id} />
      </section>

      {detail.status === "OPEN" && (
        <section id="respond" className="card scroll-mt-6">
          <h2 className="mb-1 font-display font-extrabold text-foreground">
            {myRow ? "あなたの回答" : "参加可否を回答する"}
          </h2>
          {user ? (
            <ResponseForm eventId={detail.id} candidateDates={detail.candidateDates} initial={myRow?.answers} />
          ) : (
            <p className="text-sm text-muted-foreground">
              回答するには{" "}
              <Link href="/login" className="font-semibold text-secondary-foreground underline">
                ログイン
              </Link>{" "}
              してください。主催者から共有URLをもらった場合はログインなしで回答できます。
            </p>
          )}
        </section>
      )}

      {/* id="entry": 上部の「参加する」ボタンと、みんなのカレンダーからのリンクの飛び先 */}
      <section id="entry" className="card scroll-mt-6 space-y-5">
        <h2 className="font-display font-extrabold text-foreground">登壇者・参加者</h2>
        <EntryList entries={detail.entries} showTotal={isOrganizer} />
        {detail.status === "CLOSED" ? (
          <div className="space-y-3 border-t border-card-border pt-4">
            <p className="text-sm text-muted-foreground">
              このLT会は終了したため、参加表明の受け付けも終了しています。
              {detail.myEntry && "参加履歴から外したい場合は、表明を取り消せます。"}
            </p>
            {/* 表明済みの人だけ。取り消し後も結果のメッセージを出すため、myEntry が消えても置いておく */}
            {user && !isOrganizer && <WithdrawEntryForm eventId={detail.id} hasEntry={detail.myEntry !== null} />}
          </div>
        ) : isOrganizer ? null : (
          <div className="border-t border-card-border pt-4">
            <h3 className="mb-2 font-display font-extrabold text-foreground">
              {detail.myEntry ? "あなたの参加表明" : "このLT会に参加する"}
            </h3>
            {/* 参加表明と候補日への回答は別の操作なので、表明しただけで日程が未回答なら回答も促す */}
            {detail.myEntry && detail.status === "OPEN" && !myRow && (
              <p className="mb-3 rounded-xl border border-primary bg-warning-bg px-3 py-2 text-sm text-warning-foreground">
                開催日はまだ調整中です。
                <a href="#respond" className="font-semibold underline">
                  候補日への回答
                </a>
                もお願いします。参加できる日が多い日に開催日が決まります。
              </p>
            )}
            {user ? (
              <EntryForm eventId={detail.id} initial={detail.myEntry} />
            ) : (
              <p className="text-sm text-muted-foreground">
                登壇・聴講を表明するには{" "}
                <Link href="/login" className="font-semibold text-secondary-foreground underline">
                  ログイン
                </Link>{" "}
                してください。
              </p>
            )}
          </div>
        )}
      </section>

      {isOrganizer && <OrganizerPanel detail={detail} shareUrl={shareUrl} />}

      {user && !isOrganizer && (
        <SafetyMenu
          eventId={detail.id}
          organizer={detail.organizer}
          organizerBlocked={blocks.some((b) => b.id === detail.organizer.id)}
        />
      )}
      <CommentSection
        eventId={detail.id}
        organizerId={detail.organizer.id}
        comments={comments}
        viewerId={user?.id ?? null}
      />
    </div>
  );
}
