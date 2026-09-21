import 'server-only';
import type { UserDto } from '@lt/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, TOKEN_COOKIE, apiFetch } from './api';

/** ログイン中のユーザー。未ログインやトークン失効なら null */
export async function getCurrentUser(): Promise<UserDto | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await apiFetch<UserDto>('/users/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

/** ログイン必須ページで使う。未ログインなら /login へ飛ばす */
export async function requireUser(): Promise<UserDto> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function setTokenCookie(token: string): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearTokenCookie(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
}
