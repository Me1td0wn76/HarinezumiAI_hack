'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, errorMessage } from '@/lib/api';
import { str } from './form';
import type { ActionState } from './types';

/** LT会（targetType=EVENT）かユーザー（targetType=USER）を通報する */
export async function report(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const targetType = str(formData, 'targetType');
  const targetId = str(formData, 'targetId');
  const path = targetType === 'EVENT' ? `/events/${targetId}/report` : `/users/${targetId}/report`;
  try {
    await apiFetch(path, {
      method: 'POST',
      body: { reason: str(formData, 'reason'), detail: str(formData, 'detail') || null },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  return { success: true };
}

/** ユーザーをブロック（block=true）/ 解除（block=false）する */
export async function setBlocked(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const method = formData.get('block') === 'true' ? 'POST' : 'DELETE';
  try {
    await apiFetch(`/users/${str(formData, 'userId')}/block`, { method });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  // 一覧からその人のLT会が消える / 戻るので、全ページのキャッシュを捨てる
  revalidatePath('/', 'layout');
  return { success: true };
}

/** 運営: LT会を非表示 / 再表示にする。hidden=true で非表示 */
export async function moderateEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  const action = formData.get('hidden') === 'true' ? 'hide' : 'unhide';
  try {
    await apiFetch(`/admin/events/${eventId}/${action}`, {
      method: 'POST',
      body: { note: str(formData, 'note') || null },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/admin');
  revalidatePath(`/events/${eventId}`);
  // 一覧は「LT会を探す」（/events）、HOME（/）は近日開催のLT会を出すので、両方を作り直す
  revalidatePath('/');
  revalidatePath('/events');
  return { success: true };
}
