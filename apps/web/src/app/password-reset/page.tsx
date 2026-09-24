import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/password-reset-request-form";

export const metadata: Metadata = { title: "パスワードの再設定 | LT会支援アプリ" };

export default function PasswordResetPage() {
  return (
    <div className="px-4 py-8">
      <div className="card mx-auto max-w-md">
        <span className="eyebrow mb-3">⚡ PASSWORD RESET</span>
        <h1 className="mb-2 font-display text-2xl font-black text-foreground">パスワードの再設定</h1>
        <p className="mb-4 text-sm text-muted-foreground">登録したメールアドレスに、再設定用のリンクを送ります。</p>
        <PasswordResetRequestForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-secondary-foreground underline">
            ログインに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
