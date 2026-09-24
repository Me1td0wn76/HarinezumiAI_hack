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
  /**
   * パスワード再設定メールの送信。1 回ごとに外部へメールが飛ぶので、第三者の受信箱へのメール爆撃や
   * 送信サービス（Resend）の枠・送信元ドメインの評判を守るため、ほかより大幅に厳しくする。
   * 正規の利用者が同じ IP から短時間に何度も必要とすることはまず無い（会場で一斉に使う操作でもない）
   */
  passwordResetRequest: { default: { ttl: 10 * MINUTE, limit: 5 } },
  /**
   * 新しいパスワードの設定。トークンは 256bit なので総当たりは現実的でないが、1 回ごとに bcrypt を回すので
   * 負荷をかける目的の連打を止める。入力ミスの再送には十分な回数にする
   */
  passwordResetConfirm: { default: { ttl: 10 * MINUTE, limit: 10 } },
  /** コメントの連投を防ぐ */
  comment: { default: { ttl: MINUTE, limit: 10 } },
  /** 通報の連投で運営画面を埋められないようにする（同じ対象への再通報は理由の更新なので件数は増えない） */
  report: { default: { ttl: MINUTE, limit: 10 } },
  /** ブロック・解除の連打を防ぐ */
  block: { default: { ttl: MINUTE, limit: 30 } },
} as const;
