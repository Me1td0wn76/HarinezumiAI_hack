'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch, errorMessage } from '@/lib/api';
import type { ActionState } from './types';

/**
 * 通知を既読にする。通知のリンクを押したときに裏で呼ぶ（遷移はリンク自体が行う）。
 * 失敗しても遷移の邪魔をしないよう、例外は投げずにログだけ残す（次に開けばまた既読にできる）
 */
export async function markNotificationRead(id: string): Promise<void> {
  try {
    await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  } catch (err) {
    console.warn(`通知 ${id} の既読化に失敗: ${errorMessage(err)}`);
    return;
  }
  revalidatePath('/', 'layout');
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  try {
    await apiFetch('/notifications/read-all', { method: 'POST' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    return { error: errorMessage(err) };
  }
  revalidatePath('/', 'layout');
  return { success: true };
}
