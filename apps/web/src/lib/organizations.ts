import 'server-only';
import {
  ORGANIZATION_SLUG_PATTERN,
  RESERVED_ORGANIZATION_SLUGS,
  type MyOrganizationDto,
  type OrganizationDetailDto,
} from '@lt/shared';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ApiError, TOKEN_COOKIE, apiFetch } from './api';

/**
 * 団体ページ。page と generateMetadata の両方から呼ばれるので React.cache で 1 回にまとめる。
 * Cookie のトークン付きで取得すると、OWNER には webhookUrl が、メンバーには viewerRole が含まれる。存在しない団体は 404
 * @param slug 小文字に正規化済みの slug
 */
export const getOrganization = cache(async (slug: string): Promise<OrganizationDetailDto> => {
  if (!ORGANIZATION_SLUG_PATTERN.test(slug) || RESERVED_ORGANIZATION_SLUGS.includes(slug)) notFound();
  try {
    return await apiFetch<OrganizationDetailDto>(`/organizations/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
});

/** 自分が所属する団体（LT会作成フォームの選択肢・一覧の絞り込み）。未ログインなら空 */
export const getMyOrganizations = cache(async (): Promise<MyOrganizationDto[]> => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return [];
  try {
    return await apiFetch<MyOrganizationDto[]>('/users/me/organizations');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
});
