import 'server-only';
import type { EventDetailDto } from '@lt/shared';
import { cache } from 'react';
import { apiFetch } from './api';

/**
 * LT会詳細。page と generateMetadata / opengraph-image の両方から呼ばれるので
 * React.cache で 1 リクエスト内の重複取得を防ぐ。
 * Cookie のトークン付きなので、主催者本人には shareToken が含まれる。
 */
export const getEventDetail = cache((id: string) => apiFetch<EventDetailDto>(`/events/${id}`));

/** 共有URL 経由の詳細（ログイン不要） */
export const getSharedEvent = cache((token: string) =>
  apiFetch<EventDetailDto>(`/share/${token}`, { auth: false }),
);

/** 自分自身の公開URL。OGP や共有リンクの組み立てに使う */
export function webUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}${path}`;
}
