import type { ThrottlerModuleOptions } from '@nestjs/throttler';

const MINUTE = 60_000;

/**
 * レート制限の設定。IP ごとに数える（web の BFF が X-Forwarded-For で利用者の IP を渡す。main.ts の trust proxy 参照）。
 * 全エンドポイントに default を掛け、スパムに使われやすい操作だけ @Throttle(THROTTLE.xxx) で絞る。
 *
 * LT会の会場 Wi-Fi や社内・大学のネットワーク（NAT 配下）では参加者全員が同じ IP になり、その場で一斉に
 * 登録・回答する。上限はその人数（数十人）が詰まらない程度にし、1 つの IP からの大量投稿だけを止める。
 */
export const throttlerOptions: ThrottlerModuleOptions = {
  throttlers: [{ name: 'default', ttl: MINUTE, limit: 120 }],
  errorMessage: 'リクエストが多すぎます。しばらく待ってから再度お試しください',
};

export const THROTTLE = {
  /** 捨てアカの量産を防ぐ（会場で一斉に登録しても詰まらない程度） */
  register: { default: { ttl: 10 * MINUTE, limit: 20 } },
  /** パスワードの総当たりを防ぐ */
  login: { default: { ttl: MINUTE, limit: 10 } },
  createEvent: { default: { ttl: 60 * MINUTE, limit: 10 } },
  submitResponses: { default: { ttl: MINUTE, limit: 30 } },
  /** 共有URL はログイン不要。懇親会の場で URL を配って一斉に回答されても詰まらない程度 */
  guestResponses: { default: { ttl: MINUTE, limit: 30 } },
  /** コメントの連投を防ぐ */
  comment: { default: { ttl: MINUTE, limit: 10 } },
} as const;
