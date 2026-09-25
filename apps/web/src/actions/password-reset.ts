'use server';

import { redirect } from 'next/navigation';
import { apiFetch, errorMessage } from '@/lib/api';
import { str } from './form';
import type { ActionState } from './types';

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await apiFetch('/auth/password-reset/request', {
      method: 'POST',
      auth: false,
      body: { email: str(formData, 'email') },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  // 登録の有無に関係なく同じ表示にする（API も常に 204）
  return { success: true };
}

export async function confirmPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') ?? '');
  if (password !== String(formData.get('passwordConfirm') ?? '')) {
    return { error: '確認用のパスワードが一致しません' };
  }
  try {
    await apiFetch('/auth/password-reset/confirm', {
      method: 'POST',
      auth: false,
      body: { token: str(formData, 'token'), password },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  redirect('/login?reset=1');
}
