'use server';

import { ENTRY_ROLE, type EntryRole, type SubmitEntryRequest } from '@lt/shared';
import { revalidatePath } from 'next/cache';
import { apiFetch, errorMessage } from '@/lib/api';
import { str } from './form';
import type { ActionState } from './types';

/** 参加表明（登壇 / 聴講）を作成・更新する。1人1件なので送るたびに上書きになる */
export async function submitEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  const role = str(formData, 'role');
  if (!(ENTRY_ROLE as readonly string[]).includes(role)) return { error: '登壇か聴講かを選んでください' };

  const body: SubmitEntryRequest = { role: role as EntryRole };
  if (role === 'SPEAKER') {
    const talkTitle = str(formData, 'talkTitle');
    if (!talkTitle) return { error: '発表タイトルを入力してください' };
    const duration = str(formData, 'durationMinutes');
    body.talkTitle = talkTitle;
    body.talkDetail = str(formData, 'talkDetail') || null;
    body.durationMinutes = duration ? Number(duration) : null;
  }

  try {
    await apiFetch(`/events/${eventId}/entry`, { method: 'PUT', body });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  // 表明の有無で /me の参加履歴・/calendar・プロフィールの参加予定も変わるので、詳細だけでなく全体を再検証する
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function withdrawEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  try {
    await apiFetch(`/events/${eventId}/entry`, { method: 'DELETE' });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  // submitEntry と同じく、参加履歴やカレンダーも変わるので全体を再検証する
  revalidatePath('/', 'layout');
  return { success: true };
}
