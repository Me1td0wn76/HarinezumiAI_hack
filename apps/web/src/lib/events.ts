import 'server-only';
import type { EventDetailDto } from '@lt/shared';
import { cache } from 'react';
import { apiFetch } from './api';
import { formatDateRange } from './format';

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

/**
 * 状態に合わせた呼びかけ。回答を受け付けているのは OPEN のときだけなので、
 * それ以外で「回答しよう」と出さない。CLOSED は呼びかけなし
 */
export function eventCallToAction(detail: Pick<EventDetailDto, 'status'>): string | null {
  switch (detail.status) {
    case 'OPEN':
      return '参加できる日を回答しよう';
    case 'CONFIRMED':
      return '開催日が決まりました';
    case 'CLOSED':
      return null;
  }
}

/** X / LINE に投稿する文面。決定済みなら開催日、未定なら状態に合わせた呼びかけ */
export function eventShareText(detail: EventDetailDto): string {
  const title = `「${detail.title}」`;
  if (detail.confirmedDate) {
    return `${title}${formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)} 開催`;
  }
  const cta = eventCallToAction(detail);
  return cta ? `${title}${cta}` : title;
}
