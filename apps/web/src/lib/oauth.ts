import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

/** 認可リクエストの state と PKCE の code_verifier を保持する Cookie（コールバックまでの短い間だけ） */
export const OAUTH_COOKIE = 'lt_oauth';
export const OAUTH_COOKIE_MAX_AGE = 60 * 10;

/** 対応しているプロバイダ。api の OAuthService と揃える */
export const OAUTH_PROVIDERS = ['google'] as const;
export type OAuthProviderName = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(name: string): name is OAuthProviderName {
  return (OAUTH_PROVIDERS as readonly string[]).includes(name);
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

/** PKCE（S256）の code_challenge */
export function codeChallengeOf(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}
