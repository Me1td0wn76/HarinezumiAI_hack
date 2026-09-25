import 'server-only';
import { HANDLE_PATTERN, RESERVED_HANDLES, type UserProfileDto } from '@lt/shared';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ApiError, apiFetch } from './api';

/**
 * 公開プロフィール。page と generateMetadata の両方から呼ばれるので React.cache で 1 回にまとめる。
 * Cookie のトークン付きで取得すると、閲覧者がブロックした相手の主催分が除かれる。存在しないハンドルは 404。
 * 予約語（me など）は API の別のエンドポイント（GET /users/me）に当たるので、問い合わせずに 404 にする
 * @param handle 小文字に正規化済みのハンドル
 */
export const getUserProfile = cache(async (handle: string): Promise<UserProfileDto> => {
  if (!HANDLE_PATTERN.test(handle) || RESERVED_HANDLES.includes(handle)) notFound();
  try {
    return await apiFetch<UserProfileDto>(`/users/${handle}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
});
