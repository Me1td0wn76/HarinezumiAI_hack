import { ApiError } from '@/lib/api';
import { getEventDetail } from '@/lib/events';
import { OG_CONTENT_TYPE, OG_SIZE, renderEventOgImage } from '@/lib/og-image';

export const alt = 'LT会の開催情報';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return await renderEventOgImage(await getEventDetail(id));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return new Response('Not Found', { status: 404 });
    }
    throw err;
  }
}
