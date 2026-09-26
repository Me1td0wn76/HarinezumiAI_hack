import { ENTRY_ROLE_LABEL, type EventCommentDto, type EventDetailDto, type PublicUserDto } from "@lt/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comment-section";
import { EntryForm, WithdrawEntryForm } from "@/components/entry-form";
import { EntryList } from "@/components/entry-list";
import { EventHeader } from "@/components/event-header";
import { EventFacts, ResponseBars } from "@/components/event-facts";
import { HeroShapes } from "@/components/hero-shapes";
import { OrganizerPanel } from "@/components/organizer-panel";
import { ResponseForm } from "@/components/response-form";
import { ResponseGrid } from "@/components/response-grid";
import { SafetyMenu } from "@/components/safety-menu";
import { ShareButtons } from "@/components/share-buttons";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser, getMyBlocks } from "@/lib/auth";
import { eventShareText, getEventDetail, webUrl } from "@/lib/events";
import { eventDescription } from "@/lib/og-image";

/** 本文側の見出し（発表内容・回答状況など） */
const H2 = "font-display text-2xl font-black tracking-tight";

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
    <>
    {/* ヘッダーから続く黄色い見出しエリア。タイトル・主催者・参加の入口・共有をまとめる */}
    <section className="relative overflow-hidden bg-sunny">
      <HeroShapes size="small" />
      <div className="relative mx-auto max-w-5xl space-y-5 px-4 pt-4 pb-10">
        <Link href="/events" className="inline-flex items-center gap-1 text-sm font-bold hover:underline">
          ← LT会を探す
        </Link>
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
          organization={detail.organization}
        />
        {/* 参加表明の欄はページの下のほうにあるので、上部から飛べるようにする（主催者・終了したLT会では出さない） */}
        {canEnter && (
          <div className="flex flex-wrap items-center gap-3">
            {detail.myEntry ? (
              <>
                <span className="badge bg-white text-foreground">
                  {ENTRY_ROLE_LABEL[detail.myEntry.role]}で参加表明済み
                </span>
                <a href="#entry" className="text-sm font-bold underline decoration-accent-strong decoration-2 underline-offset-4">
                  参加表明を確認・変更する
                </a>
              </>
            ) : (
              <a href="#entry" className="btn-primary h-14 px-8 text-base">
                このLT会に参加する
              </a>
            )}
          </div>
        )}
        {/* 非表示のLT会は主催者と運営以外に見えないので、共有ボタンは出さない */}
        {!detail.hidden && <ShareButtons url={webUrl(`/events/${detail.id}`)} text={shareText} compact />}
      </div>
    </section>

    {/*
      提案（案5）の2段組み。左に開催情報・回答状況など、右に参加表明の欄を置く。
      スマホでは「開催情報・発表内容 → 参加表明 → 残り」の順に縦に並ぶよう、左の列を2つに分けている
    */}
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
      <div className="min-w-0 space-y-10">
        <EventFacts detail={detail} />
        {detail.description && (
          <section className="space-y-3">
            <h2 className={H2}>発表内容</h2>
            <p className="text-base leading-loose font-medium whitespace-pre-wrap [overflow-wrap:anywhere]">{detail.description}</p>
          </section>
        )}
      </div>

      {/* id="entry": 上部の「参加する」ボタンと、みんなのカレンダーからのリンクの飛び先 */}
      <aside
        id="entry"
        aria-labelledby="entry-heading"
        className="scroll-mt-6 space-y-5 rounded-[1.75rem] bg-card p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
      >
        {isOrganizer ? (
          <>
            <h2 id="entry-heading" className={H2}>主催者のあなたへ</h2>
            <p className="text-sm leading-relaxed">
              主催者は参加表明できません。共有URL・候補日の追加・開催日の決定は
              <a href="#organizer" className="font-bold underline decoration-accent-strong decoration-2 underline-offset-4">
                主催者メニュー
              </a>
              から行えます。
            </p>
          </>
        ) : detail.status === "CLOSED" ? (
          <>
            <h2 id="entry-heading" className={H2}>参加表明</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              このLT会は終了したため、参加表明の受け付けも終了しています。
              {detail.myEntry && "参加履歴から外したい場合は、表明を取り消せます。"}
            </p>
            {/* 表明済みの人だけ。取り消し後も結果のメッセージを出すため、myEntry が消えても置いておく */}
            {user && <WithdrawEntryForm eventId={detail.id} hasEntry={detail.myEntry !== null} />}
          </>
        ) : (
          <>
            <h2 id="entry-heading" className={H2}>
              {detail.myEntry ? "あなたの参加表明" : "このLT会に参加する"}
            </h2>
            {/* 参加表明と候補日への回答は別の操作なので、表明しただけで日程が未回答なら回答も促す */}
            {detail.myEntry && detail.status === "OPEN" && !myRow && (
              <p className="rounded-xl bg-white px-4 py-3 text-sm leading-relaxed font-bold">
                開催日はまだ調整中です。
                <a href="#respond" className="underline decoration-accent-strong decoration-2 underline-offset-4">
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
          </>
        )}
      </aside>

      <div className="min-w-0 space-y-10 lg:col-start-1">
        <section className="space-y-5">
          <h2 className={H2}>回答状況</h2>
          {detail.tallies.length > 0 ? (
            <>
              <ResponseBars detail={detail} />
              {/* 回答者ごとの ○△× と回答時のコメントは、たたんでおき、押すと開く（ブラウザ標準の details なのでキーボード・読み上げでも開ける） */}
              <details className="group card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl font-display font-black [&::-webkit-details-marker]:hidden">
                  回答者ごとの回答を見る（{detail.responders.length}人）
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="mt-4">
                  <ResponseGrid detail={detail} highlightKey={user?.id} />
                </div>
              </details>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">候補日がまだありません。</p>
          )}
        </section>

        {detail.status === "OPEN" && (
          <section id="respond" className="card scroll-mt-6">
            <h2 className="mb-1 font-display text-lg font-black">
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

        <section className="space-y-4">
          <h2 className={H2}>登壇者・参加者</h2>
          <EntryList entries={detail.entries} showTotal={isOrganizer} />
        </section>

        {isOrganizer && (
          <div id="organizer" className="scroll-mt-6">
            <OrganizerPanel detail={detail} shareUrl={shareUrl} />
          </div>
        )}

        <CommentSection
          eventId={detail.id}
          organizerId={detail.organizer.id}
          comments={comments}
          viewerId={user?.id ?? null}
        />

        {user && !isOrganizer && (
          <SafetyMenu
            eventId={detail.id}
            organizer={detail.organizer}
            organizerBlocked={blocks.some((b) => b.id === detail.organizer.id)}
          />
        )}
      </div>
    </div>
    </>
  );
}
