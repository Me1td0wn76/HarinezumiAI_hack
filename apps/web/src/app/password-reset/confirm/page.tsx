import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetConfirmForm } from "@/components/password-reset-confirm-form";

export const metadata: Metadata = {
  title: "新しいパスワードの設定 | LT会支援アプリ",
  // URL にトークンが含まれるので、外部へのリクエストに Referer として漏らさない
  referrer: "no-referrer",
  robots: { index: false },
};

export default async function PasswordResetConfirmPage(props: PageProps<"/password-reset/confirm">) {
  const { token } = await props.searchParams;
  return (
    <div className="px-4 py-8">
      <div className="card mx-auto max-w-md">
        <span className="eyebrow mb-3">⚡ PASSWORD RESET</span>
        <h1 className="mb-4 font-display text-2xl font-black text-foreground">新しいパスワードの設定</h1>
        {typeof token === "string" && token ? (
          <PasswordResetConfirmForm token={token} />
        ) : (
          <p className="text-sm text-muted-foreground">
            リンクが正しくありません。
            <Link href="/password-reset" className="font-semibold text-secondary-foreground underline">
              もう一度再設定をリクエスト
            </Link>
            してください。
          </p>
        )}
      </div>
    </div>
  );
}
