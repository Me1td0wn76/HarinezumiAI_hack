import { config } from 'dotenv';
import { resolve } from 'node:path';

// e2e テストは lt_test（apps/api/.env.test）に対して実行する。
// dotenv は既に設定済みの process.env を上書きしないので、CI のように
// ジョブの環境変数として DATABASE_URL 等を渡す場合はそちらが優先される。
const hadDatabaseUrl = Boolean(process.env.DATABASE_URL);
const loaded = config({ path: resolve(import.meta.dirname, '../.env.test') });

// .env.test が無いと config() は例外を投げずに黙って何もしない。すると AppModule が
// 既定の apps/api/.env（開発DB）を読み、e2e が開発データベースに対して実行されてしまう
if (loaded.error && !hadDatabaseUrl) {
  throw new Error('apps/api/.env.test がありません。README の「API の e2e テストを動かす」を参照してください');
}

// 接続先が本当にテスト用DBかも確認しておく（開発DBへの誤実行を防ぐ最後の網）
if (!/lt_test/.test(process.env.DATABASE_URL ?? '')) {
  throw new Error(`e2e はテスト用DB（lt_test）に対してのみ実行できます: ${process.env.DATABASE_URL}`);
}
