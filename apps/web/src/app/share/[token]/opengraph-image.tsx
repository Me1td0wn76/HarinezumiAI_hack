import { ApiError } from '@/lib/api';
import { getSharedEvent } from '@/lib/events';
import { OG_CONTENT_TYPE, OG_SIZE, renderEventOgImage } from '@/lib/og-image';

export const alt = 'LT会の開催情報';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    return await renderEventOgImage(await getSharedEvent(token));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return new Response('Not Found', { status: 404 });
    }
    throw err;
  }
}
