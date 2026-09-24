import type { NotificationDto, NotificationType, PageDto } from "@lt/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllNotificationsRead, openNotification } from "@/actions/notifications";
import { ApiError, apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getUnreadNotificationCount } from "@/lib/notifications";

const TYPE_ICON: Record<NotificationType, string> = {
  EVENT_CREATED: "📣",
  EVENT_CONFIRMED: "✅",
};

export default async function NotificationsPage(props: PageProps<"/notifications">) {
  await requireUser();
  const { cursor: cursorParam } = await props.searchParams;
  // 1ページずつ取得する。?cursor=<通知ID> でそれより古い通知を表示する
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
    if (cursor && err instanceof ApiError && (err.status === 400 || err.status === 404)) redirect("/notifications");
    throw err;
  }
  const notifications = list.items;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black text-foreground">通知</h1>
        {/* 表示中のページだけでなく、全体に未読が残っていれば出す */}
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="btn-secondary text-xs">
              すべて既読にする
            </button>
          </form>
        )}
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
          {notifications.map((n) => (
            <li key={n.id}>
              <form action={openNotification.bind(null, n.id)}>
                <button
                  type="submit"
                  className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-muted focus-visible:bg-muted ${
                    n.readAt ? "" : "bg-secondary/60"
                  }`}
                >
                  <span aria-hidden="true" className="text-lg leading-6">
                    {TYPE_ICON[n.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      {!n.readAt && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-danger-foreground">
                          <span className="sr-only">未読</span>
                        </span>
                      )}
                      <span className="font-display text-sm font-bold wrap-anywhere text-foreground">{n.title}</span>
                    </span>
                    <span className="mt-0.5 block text-sm wrap-anywhere text-muted-foreground">{n.body}</span>
                    <time dateTime={n.createdAt} className="mt-1 block text-xs text-subtle">
                      {formatDateTime(n.createdAt)}
                    </time>
                  </span>
                </button>
              </form>
            </li>
          ))}
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
