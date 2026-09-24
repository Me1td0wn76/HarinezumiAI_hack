import type { ThrottlerModuleOptions } from '@nestjs/throttler';

const MINUTE = 60_000;

/**
 * レート制限の設定。IP ごとに数える（web の BFF が X-Forwarded-For で利用者の IP を渡す。main.ts の trust proxy 参照）。
 * 全エンドポイントに default を掛け、スパムに使われやすい操作だけ @Throttle(THROTTLE.xxx) で絞る。
 */
export const throttlerOptions: ThrottlerModuleOptions = {
  throttlers: [{ name: 'default', ttl: MINUTE, limit: 120 }],
  errorMessage: 'リクエストが多すぎます。しばらく待ってから再度お試しください',
};

export const THROTTLE = {
  /** 捨てアカの量産を防ぐ */
  register: { default: { ttl: 10 * MINUTE, limit: 5 } },
  /** パスワードの総当たりを防ぐ */
  login: { default: { ttl: MINUTE, limit: 10 } },
  createEvent: { default: { ttl: 60 * MINUTE, limit: 10 } },
  submitResponses: { default: { ttl: MINUTE, limit: 30 } },
  /** 共有URL はログイン不要なので、ログインユーザーの回答より厳しくする */
  guestResponses: { default: { ttl: MINUTE, limit: 10 } },
} as const;
