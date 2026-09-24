import type { EventFormat } from '@lt/shared';

export interface FormatFields {
  format: EventFormat;
  venue: string | null;
  meetingUrl: string | null;
}

/**
 * 開催形式に合わない項目を落とす。
 * ONLINE なら会場は不要、OFFLINE なら配信URL は不要。空文字は null にする。
 */
export function normalizeFormatFields(
  format: EventFormat,
  venue?: string | null,
  meetingUrl?: string | null,
): FormatFields {
  const v = venue?.trim() || null;
  const u = meetingUrl?.trim() || null;
  return {
    format,
    venue: format === 'ONLINE' ? null : v,
    meetingUrl: format === 'OFFLINE' ? null : u,
  };
}
