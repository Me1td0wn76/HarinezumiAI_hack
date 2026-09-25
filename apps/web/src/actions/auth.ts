'use server';

import type { AuthResponse } from '@lt/shared';
import { redirect } from 'next/navigation';
import { apiFetch, errorMessage } from '@/lib/api';
import { clearTokenCookie, setTokenCookie } from '@/lib/auth';
import { str } from './form';
import type { ActionState } from './types';

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email: str(formData, 'email'), password: formData.get('password') },
    });
    await setTokenCookie(res.accessToken);
  } catch (err) {
    return { error: errorMessage(err) };
  }
  // redirect() は例外を投げて遷移するので try の外で呼ぶ
  redirect('/');
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        email: str(formData, 'email'),
        password: formData.get('password'),
        displayName: str(formData, 'displayName'),
        handle: str(formData, 'handle'),
        agreeToTerms: formData.get('agreeToTerms') === 'on',
      },
    });
    await setTokenCookie(res.accessToken);
  } catch (err) {
    return { error: errorMessage(err) };
  }
  redirect('/');
}

export async function logout(): Promise<void> {
  await clearTokenCookie();
  redirect('/');
}
