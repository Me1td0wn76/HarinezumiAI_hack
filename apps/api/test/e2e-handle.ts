import { randomBytes } from 'node:crypto';

/** e2e で登録するユーザーのハンドル。実行ごとに重複しないようランダムにする（"e2e_" + 16進 12 文字） */
export function e2eHandle(): string {
  return `e2e_${randomBytes(6).toString('hex')}`;
}
