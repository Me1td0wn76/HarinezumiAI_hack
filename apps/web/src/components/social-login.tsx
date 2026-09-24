import type { OAuthProvidersDto } from "@lt/shared";
import { apiFetch } from "@/lib/api";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "ソーシャルログインに失敗しました。もう一度お試しください。",
  oauth_unavailable: "このログイン方法は現在使えません。",
  oauth_email_conflict:
    "そのメールアドレスは登録済みです。下のフォームからメールアドレスとパスワードでログインしてください。",
  oauth_email_unverified: "メールアドレスが確認されていないアカウントでは登録できません。",
};

/** 「Google でログイン」ボタン。api 側で設定されているプロバイダだけ出す */
export async function SocialLogin({ error }: { error?: string }) {
  const providers = await apiFetch<OAuthProvidersDto>("/auth/oauth/providers", { auth: false }).catch(
    (): OAuthProvidersDto => ({ google: false }),
  );
  const message = error ? ERROR_MESSAGES[error] : undefined;
  if (!providers.google && !message) return null;

  return (
    <div className="mx-auto max-w-md space-y-3">
      {message && (
        <p role="alert" className="rounded-xl border border-danger bg-danger-bg px-3 py-2 text-sm text-danger-foreground">
          {message}
        </p>
      )}
      {providers.google && (
        <>
          {/* Route Handler（外部サイトへリダイレクトする）への遷移なので next/link ではなく a を使う。
              Link だとプリフェッチやクライアント遷移で認可リクエストが走ってしまう */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/auth/google" className="btn-secondary w-full">
            <svg aria-hidden viewBox="0 0 48 48" className="h-4 w-4">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" />
              <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
            </svg>
            Google でログイン
          </a>
          <p className="text-center text-xs text-subtle">または</p>
        </>
      )}
    </div>
  );
}
