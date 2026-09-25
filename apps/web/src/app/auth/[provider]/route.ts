import type { OAuthAuthorizeUrlDto } from '@lt/shared';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { OAUTH_COOKIE, OAUTH_COOKIE_MAX_AGE, codeChallengeOf, isOAuthProvider, randomToken } from '@/lib/oauth';

/**
 * 「Google でログイン」の入口。state と PKCE の code_verifier を作って Cookie に保持し、プロバイダの認可画面へ送る。
 * クライアント ID やコールバック URL は api が持つので、ここでは認可画面の URL を api から受け取るだけ
 */
export async function GET(_request: Request, ctx: RouteContext<'/auth/[provider]'>) {
  const { provider } = await ctx.params;
  if (!isOAuthProvider(provider)) notFound();

  const state = randomToken();
  const codeVerifier = randomToken();
  let url: string;
  try {
    const query = new URLSearchParams({ state, codeChallenge: codeChallengeOf(codeVerifier) });
    ({ url } = await apiFetch<OAuthAuthorizeUrlDto>(`/auth/oauth/${provider}/url?${query.toString()}`, { auth: false }));
  } catch {
    redirect('/login?error=oauth_unavailable');
  }

  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ provider, state, codeVerifier }), {
    httpOnly: true,
    // プロバイダからのリダイレクト（トップレベルの GET）で送られるよう lax にする
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/auth',
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  redirect(url);
}
