import type { AuthResponse } from '@lt/shared';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { ApiError, apiFetch } from '@/lib/api';
import { setTokenCookie } from '@/lib/auth';
import { OAUTH_COOKIE, isOAuthProvider } from '@/lib/oauth';

/** プロバイダから戻ってくる先。state を確かめ、認可コードを api に渡してログインする */
export async function GET(request: NextRequest, ctx: RouteContext<'/auth/[provider]/callback'>) {
  const { provider } = await ctx.params;
  if (!isOAuthProvider(provider)) notFound();

  const cookieStore = await cookies();
  const saved = parseSaved(cookieStore.get(OAUTH_COOKIE)?.value);
  cookieStore.delete({ name: OAUTH_COOKIE, path: '/auth' });

  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  // state が一致しなければ、第三者が用意した認可コードでログインさせる攻撃（CSRF）の可能性がある
  if (!saved || saved.provider !== provider || !code || params.get('state') !== saved.state) {
    redirect('/login?error=oauth_failed');
  }

  let errorCode: string | null = null;
  try {
    const res = await apiFetch<AuthResponse>(`/auth/oauth/${provider}`, {
      method: 'POST',
      auth: false,
      body: { code, codeVerifier: saved.codeVerifier },
    });
    await setTokenCookie(res.accessToken);
  } catch (err) {
    errorCode = toErrorCode(err);
  }
  // redirect() は例外を投げて遷移するので try の外で呼ぶ
  redirect(errorCode ? `/login?error=${errorCode}` : '/');
}

/** api のエラーを /login?error= のコードに変える（文言は components/social-login.tsx） */
function toErrorCode(err: unknown): string {
  if (err instanceof ApiError) {
    // 同じメールアドレスのアカウントが既にある（自動では紐付けない）
    if (err.status === 409) return 'oauth_email_conflict';
    if (err.status === 403) return 'oauth_email_unverified';
    if (err.status === 503) return 'oauth_unavailable';
  }
  return 'oauth_failed';
}

function parseSaved(value: string | undefined): { provider: string; state: string; codeVerifier: string } | null {
  if (!value) return null;
  try {
    const v = JSON.parse(value) as Record<string, unknown>;
    return typeof v.provider === 'string' && typeof v.state === 'string' && typeof v.codeVerifier === 'string'
      ? { provider: v.provider, state: v.state, codeVerifier: v.codeVerifier }
      : null;
  } catch {
    return null;
  }
}
