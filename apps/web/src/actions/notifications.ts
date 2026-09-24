'use server';

import type { NotificationDto } from '@lt/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';

/** 通知を既読にして、その遷移先へ移動する */
export async function openNotification(id: string): Promise<void> {
  let n: NotificationDto;
  try {
    // 遷移先はクライアントから受け取らず、API が返す値を使う（改ざんされた URL へ飛ばさないため）
    n = await apiFetch<NotificationDto>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  } catch (err) {
    handleApiError(err);
  }
  revalidatePath('/', 'layout');
  redirect(isInternalPath(n.link) ? n.link : '/notifications');
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await apiFetch('/notifications/read-all', { method: 'POST' });
  } catch (err) {
    handleApiError(err);
  }
  revalidatePath('/', 'layout');
}

/**
 * ログイン切れはログイン画面へ、通知が見つからない（別タブで消えた等）は一覧を出し直す。
 * それ以外はエラー画面に任せる。
 */
function handleApiError(err: unknown): never {
  if (err instanceof ApiError && err.status === 401) redirect('/login');
  if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
    revalidatePath('/', 'layout');
    redirect('/notifications');
  }
  throw err;
}

/** サイト内のパスだけを許可する（"//evil.example" のようなプロトコル相対 URL は弾く） */
function isInternalPath(link: string | null): link is string {
  return !!link && link.startsWith('/') && !link.startsWith('//') && !link.startsWith('/\\');
}
