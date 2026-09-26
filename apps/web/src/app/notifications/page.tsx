import type { NotificationDto, PageDto } from "@lt/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MarkAllReadButton } from "@/components/mark-all-read-button";
import { NotificationLink } from "@/components/notification-link";
import { ApiError, apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getUnreadNotificationCount } from "@/lib/notifications";

/**
 * 通知の文面。API は種類と値（LT会名・日時など）だけを返すので、ここで組み立てる。
 * 文言や日時の書式を変えると、過去の通知にもそのまま反映される
 */
function describe(n: NotificationDto): { icon: string; title: string; body: string } {
  switch (n.type) {
    case "EVENT_CREATED":
      return {
        icon: "📣",
        title: `新しいLT会「${n.data.eventTitle}」`,
        body: `${n.data.organizerName} さんがLT会を作成しました。候補日 ${n.data.candidateDateCount} 件から参加できる日を回答しましょう`,
      };
    case "EVENT_CONFIRMED":
      return {
        icon: "✅",
        title: `「${n.data.eventTitle}」の開催日が決まりました`,
        body: `📅 ${formatDateTime(n.data.startsAt)}`,
      };
    case "SPEAKER_ENTERED":
      return {
        icon: "🎤",
        title: `「${n.data.eventTitle}」に登壇の表明がありました`,
        body: `${n.data.speakerName} さん: ${n.data.talkTitle}`,
      };
  }
}

export default async function NotificationsPage(props: PageProps<"/notifications">) {
  await requireUser();
  const { cursor: cursorParam } = await props.searchParams;
  // 1ページずつ取得する。?cursor=<前ページの nextCursor> でそれより古い通知を表示する
  const cursor = typeof cursorParam === "string" && cursorParam ? cursorParam : undefined;

  let list: PageDto<NotificationDto>;
  let unread: number;
  try {
    [list, unread] = await Promise.all([
      apiFetch<PageDto<NotificationDto>>(`/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
      getUnreadNotificationCount(),
    ]);
  } catch (err) {
    // URL を手で書き換えた等で cursor が不正なら、最新の通知に戻す
    if (cursor && err instanceof ApiError && err.status === 400) redirect("/notifications");
    throw err;
  }
  const notifications = list.items;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-black text-foreground">通知</h1>
        {/* 表示中のページだけでなく、全体に未読が残っていれば出す */}
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {cursor && (
        <Link href="/notifications" className="inline-block text-sm font-semibold text-secondary-foreground underline">
          ← 最新の通知に戻る
        </Link>
      )}

      {notifications.length === 0 ? (
        <div className="card text-center text-muted-foreground">通知はまだありません。</div>
      ) : (
        <ul className="card divide-y divide-card-border overflow-hidden p-0">
          {notifications.map((n) => {
            const { icon, title, body } = describe(n);
            const isUnread = !n.readAt;
            const className = `flex w-full items-start gap-3 px-5 py-4 text-left ${isUnread ? "bg-secondary/60" : ""}`;
            const content = (
              <>
                <span aria-hidden="true" className="text-lg leading-6">
                  {icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {isUnread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-danger-foreground">
                        <span className="sr-only">未読</span>
                      </span>
                    )}
                    <span className="font-display text-sm font-bold wrap-anywhere text-foreground">{title}</span>
                  </span>
                  <span className="mt-0.5 block text-sm wrap-anywhere text-muted-foreground">{body}</span>
                  <time dateTime={n.createdAt} className="mt-1 block text-xs text-subtle">
                    {formatDateTime(n.createdAt)}
                  </time>
                </span>
              </>
            );
            return (
              <li key={n.id}>
                {n.eventId ? (
                  <NotificationLink
                    id={n.id}
                    // 登壇の表明は、主催者が確認する「登壇者・参加者」の欄へ直接飛ばす
                    href={`/events/${n.eventId}${n.type === "SPEAKER_ENTERED" ? "#entry" : ""}`}
                    unread={isUnread}
                    className={`${className} transition hover:bg-muted focus-visible:bg-muted`}
                  >
                    {content}
                  </NotificationLink>
                ) : (
                  <div className={className}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {list.nextCursor && (
        <div className="text-center">
          <Link href={`/notifications?cursor=${encodeURIComponent(list.nextCursor)}`} className="btn-secondary text-xs">
            古い通知を見る
          </Link>
        </div>
      )}
    </div>
  );
}
