import 'server-only';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/** JWT を保持する httpOnly Cookie の名前 */
export const TOKEN_COOKIE = 'lt_token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchInit extends Omit<RequestInit, 'body'> {
  /** JSON にシリアライズして送る */
  body?: unknown;
  /** false にすると Cookie のトークンを付けない */
  auth?: boolean;
}

/**
 * サーバー側から NestJS API を呼ぶ共通関数。
 * Cookie に保存した JWT を Authorization ヘッダに載せる。
 * ブラウザから直接 API を呼ばない（BFF 構成）ので、この関数は Server Component / Server Function からのみ使う。
 */
export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { body, auth = true, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Accept', 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, extractMessage(json, res.status));
  return json as T;
}

/** NestJS のエラーレスポンス（message が string | string[]）から表示用メッセージを取り出す */
function extractMessage(json: unknown, status: number): string {
  if (json && typeof json === 'object' && 'message' in json) {
    const m = (json as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.map(String).join('\n');
  }
  return `APIエラー (${status})`;
}

/** Server Function 内で catch した例外をユーザー向け文言にする */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message.includes('fetch failed')) {
    return 'APIサーバーに接続できません。apps/api が起動しているか確認してください';
  }
  return '予期しないエラーが発生しました';
}
