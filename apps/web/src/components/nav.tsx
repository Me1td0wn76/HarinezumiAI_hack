import Link from "next/link";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export async function Nav() {
  const user = await getCurrentUser();

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
