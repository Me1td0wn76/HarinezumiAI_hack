import Link from "next/link";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function Nav() {
  const [user, unread] = await Promise.all([getCurrentUser(), getUnreadNotificationCount()]);

  return (
    <header className="border-b border-card-border bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[0.625rem] bg-primary font-display text-sm font-black text-primary-foreground shadow-[0_2px_6px_rgba(245,200,0,0.4)]">
            ⚡
          </span>
          <span className="font-display text-xl font-black tracking-tight text-foreground">LT会支援</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/events/new" className="btn-primary">
                ⚡ LT会を作る
              </Link>
              <Link href="/calendar" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">
                カレンダー
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="font-display text-sm font-bold text-danger-foreground hover:text-foreground">
                  運営
                </Link>
              )}
              <Link
                href="/notifications"
                aria-label={unread > 0 ? `通知（未読 ${unread} 件）` : "通知"}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg hover:bg-muted"
              >
                <span aria-hidden="true">🔔</span>
                {unread > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-foreground px-1 font-display text-[10px] font-black leading-none text-white"
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/me" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">
                {user.displayName}
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm text-subtle hover:text-foreground">
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">
                ログイン
              </Link>
              <Link href="/register" className="btn-primary">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
