import Link from "next/link";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";

const navLink = "font-display text-sm font-bold text-foreground/80 underline-offset-8 hover:text-foreground hover:underline";

/** 稲妻のロゴマーク（飾り） */
function Bolt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" />
    </svg>
  );
}

/**
 * 全ページ共通のヘッダー。明るい黄色の帯で、HOME や各ページ上部の黄色い見出しエリアと続いて見えるようにする
 */
export async function Nav() {
  const [user, unread] = await Promise.all([getCurrentUser(), getUnreadNotificationCount()]);

  return (
    <header className="border-b-2 border-foreground/25 bg-sunny">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-3 focus-visible:outline-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-accent-strong">
            <Bolt className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-black tracking-tight text-foreground">LT会支援</span>
        </Link>
        <nav aria-label="メイン" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/events" className={navLink}>
            LT会を探す
          </Link>
          {user ? (
            <>
              <Link href="/calendar" className={navLink}>
                カレンダー
              </Link>
              <Link href="/orgs" className={navLink}>
                団体
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="font-display text-sm font-bold text-danger-foreground hover:underline">
                  運営
                </Link>
              )}
              <Link
                href="/notifications"
                aria-label={unread > 0 ? `通知（未読 ${unread} 件）` : "通知"}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 transition hover:bg-white"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
                  <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
                {unread > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-foreground px-1 font-display text-[10px] font-black leading-none text-white"
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/me" className={navLink}>
                {user.displayName}
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                  ログアウト
                </button>
              </form>
              <Link href="/events/new" className="btn-primary">
                <Bolt className="h-4 w-4" />
                LT会を作る
              </Link>
            </>
          ) : (
            <>
              {/* みんなのカレンダーはログインなしで見られる */}
              <Link href="/calendar?view=all" className={navLink}>
                カレンダー
              </Link>
              {/* 団体のページもログインなしで見られる（LT会のカードから団体ページに来た人が一覧に戻れるように） */}
              <Link href="/orgs" className={navLink}>
                団体
              </Link>
              <Link href="/login" className={navLink}>
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
