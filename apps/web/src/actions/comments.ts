'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, errorMessage } from '@/lib/api';
import { str } from './form';
import type { ActionState } from './types';

/** 失敗したときに入力した本文をフォームへ戻すため、body も返す */
export type CommentActionState = (ActionState & { body?: string }) | undefined;

export async function postComment(_prev: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const eventId = str(formData, 'eventId');
  const body = str(formData, 'body');
  if (!body) return { error: 'コメントを入力してください' };
  try {
    await apiFetch(`/events/${eventId}/comments`, { method: 'POST', body: { body } });
  } catch (err) {
    return { error: errorMessage(err), body };
  }
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function deleteComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  try {
    await apiFetch(`/events/${eventId}/comments/${str(formData, 'commentId')}`, { method: 'DELETE' });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
