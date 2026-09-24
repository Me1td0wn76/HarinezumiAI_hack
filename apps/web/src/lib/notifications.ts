import 'server-only';
import type { UnreadCountDto } from '@lt/shared';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { TOKEN_COOKIE, apiFetch } from './api';

/**
 * ヘッダーのバッジ用の未読件数。未ログインなら 0。
 * 全ページのヘッダーで呼ぶため、取得に失敗してもページ全体を落とさず 0 として扱う。
 * ヘッダーと通知ページの両方で使うので、同じリクエスト内では1回だけ API を呼ぶ。
 */
export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return 0;
  try {
    const { count } = await apiFetch<UnreadCountDto>('/notifications/unread-count');
    return count;
  } catch {
    return 0;
  }
});
