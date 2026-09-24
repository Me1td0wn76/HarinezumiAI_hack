'use server';

import type { EventDetailDto, EventListQuery, EventSummaryDto, PageDto, UserDto } from '@lt/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, errorMessage } from '@/lib/api';
import { toEventsSearchParams } from '@/lib/events-query';
import { parseCandidateDates, parseResponses, parseTags, str } from './form';
import type { ActionState } from './types';

export async function createEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const candidateDates = parseCandidateDates(formData);
  if (candidateDates.length === 0) return { error: '候補日を1つ以上入力してください' };

  let created: EventDetailDto;
  try {
    created = await apiFetch<EventDetailDto>('/events', {
      method: 'POST',
      body: {
        title: str(formData, 'title'),
        description: str(formData, 'description'),
        candidateDates,
        tags: parseTags(formData),
        format: str(formData, 'format') || undefined,
        venue: str(formData, 'venue') || null,
        meetingUrl: str(formData, 'meetingUrl') || null,
      },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/');
  redirect(`/events/${created.id}`);
}

export async function updateEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  try {
    await apiFetch<EventDetailDto>(`/events/${eventId}`, {
      method: 'PATCH',
      body: { title: str(formData, 'title'), description: str(formData, 'description') },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/');
  redirect(`/events/${eventId}`);
}

export async function deleteEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await apiFetch(`/events/${str(formData, 'eventId')}`, { method: 'DELETE' });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/');
  redirect('/');
}

export async function submitResponses(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  const responses = parseResponses(formData);
  if (responses.length === 0) return { error: '1つ以上の候補日に回答してください' };
  try {
    await apiFetch(`/events/${eventId}/responses`, { method: 'PUT', body: { responses } });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/');
  return { success: true };
}

export async function confirmEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  try {
    await apiFetch(`/events/${eventId}/confirm`, {
      method: 'POST',
      body: { eventDateId: str(formData, 'eventDateId') },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/');
  return { success: true };
}

export async function addDates(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  const candidateDates = parseCandidateDates(formData);
  if (candidateDates.length === 0) return { error: '候補日を入力してください' };
  try {
    await apiFetch(`/events/${eventId}/dates`, { method: 'POST', body: { candidateDates } });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function removeDate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = str(formData, 'eventId');
  try {
    await apiFetch(`/events/${eventId}/dates/${str(formData, 'eventDateId')}`, { method: 'DELETE' });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await apiFetch<UserDto>('/users/me', {
      method: 'PATCH',
      body: { displayName: str(formData, 'displayName'), bio: str(formData, 'bio') || null },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath('/', 'layout');
  return { success: true };
}

/** 「もっと見る」用。EventList（Client Component）から呼ばれる */
export async function loadMoreEvents(query: EventListQuery, cursor: string): Promise<PageDto<EventSummaryDto>> {
  const qs = toEventsSearchParams({ ...query, cursor });
  return apiFetch<PageDto<EventSummaryDto>>(`/events?${qs}`, { auth: false });
}
