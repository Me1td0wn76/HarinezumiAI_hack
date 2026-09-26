'use server';

import type { OrganizationDetailDto } from '@lt/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, errorMessage } from '@/lib/api';
import { str } from './form';
import type { ActionState } from './types';

export async function createOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let created: OrganizationDetailDto;
  try {
    created = await apiFetch<OrganizationDetailDto>('/organizations', {
      method: 'POST',
      body: {
        name: str(formData, 'name'),
        slug: str(formData, 'slug'),
        description: str(formData, 'description') || null,
        webhookUrl: str(formData, 'webhookUrl') || null,
      },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/orgs');
  redirect(`/orgs/${created.slug}`);
}

/** OWNER のみ。slug を変えたら新しい URL に移動する */
export async function updateOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const currentSlug = str(formData, 'currentSlug');
  let updated: OrganizationDetailDto;
  try {
    updated = await apiFetch<OrganizationDetailDto>(`/organizations/${currentSlug}`, {
      method: 'PATCH',
      body: {
        name: str(formData, 'name'),
        slug: str(formData, 'slug'),
        description: str(formData, 'description') || null,
        webhookUrl: str(formData, 'webhookUrl') || null,
      },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/orgs');
  // 団体名はLT会のカードにも出る
  revalidatePath('/');
  if (updated.slug !== currentSlug) redirect(`/orgs/${updated.slug}`);
  revalidatePath(`/orgs/${currentSlug}`);
  return { success: true };
}

export async function deleteOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await apiFetch(`/organizations/${str(formData, 'slug')}`, { method: 'DELETE' });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/orgs');
  revalidatePath('/');
  redirect('/orgs');
}

/** OWNER がハンドルでメンバーを追加する（招待制） */
export async function addOrganizationMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = str(formData, 'slug');
  try {
    await apiFetch(`/organizations/${slug}/members`, {
      method: 'POST',
      body: { handle: str(formData, 'handle'), role: str(formData, 'role') || undefined },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/orgs/${slug}`);
  return { success: true };
}

export async function updateOrganizationMemberRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = str(formData, 'slug');
  try {
    await apiFetch(`/organizations/${slug}/members/${str(formData, 'userId')}`, {
      method: 'PATCH',
      body: { role: str(formData, 'role') },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/orgs/${slug}`);
  return { success: true };
}

/** OWNER がメンバーを外す、または本人が抜ける */
export async function removeOrganizationMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = str(formData, 'slug');
  try {
    await apiFetch(`/organizations/${slug}/members/${str(formData, 'userId')}`, { method: 'DELETE' });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/orgs/${slug}`);
  return { success: true };
}
