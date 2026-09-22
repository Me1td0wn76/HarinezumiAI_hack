'use server';

import type { EventDetailDto } from '@lt/shared';
import { revalidatePath } from 'next/cache';
import { apiFetch, errorMessage } from '@/lib/api';
import { parseResponses, str } from './form';
import type { ActionState } from './types';

/** 共有URL からのゲスト回答。ログイン不要 */
export async function submitGuestResponses(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = str(formData, 'token');
  const guestKey = str(formData, 'guestKey');
  const guestName = str(formData, 'guestName');
  if (!guestName) return { error: '名前を入力してください' };

  const responses = parseResponses(formData);
  if (responses.length === 0) return { error: '1つ以上の候補日に回答してください' };

  try {
    await apiFetch(`/share/${token}/responses`, {
      method: 'PUT',
      auth: false,
      body: { guestKey, guestName, responses },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/share/${token}`);
  return { success: true };
}

/** 回答済みゲストの配信URL。未回答や未決定なら null */
export async function fetchGuestMeetingUrl(token: string, guestKey: string): Promise<string | null> {
  const detail = await apiFetch<EventDetailDto>(`/share/${token}?guestKey=${encodeURIComponent(guestKey)}`, {
    auth: false,
  });
  return detail.meetingUrl;
}
