import Link from "next/link";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-700">
          ⚡ LT会支援
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/events/new" className="btn-primary">
                LT会を作る
              </Link>
              <Link href="/me" className="text-stone-600 hover:text-stone-900">
                {user.displayName}
              </Link>
              <form action={logout}>
                <button type="submit" className="text-stone-500 hover:text-stone-900">
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-stone-600 hover:text-stone-900">
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
