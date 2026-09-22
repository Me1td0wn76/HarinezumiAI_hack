import { config } from 'dotenv';
import { resolve } from 'node:path';

// e2e テストは lt_test（apps/api/.env.test）に対して実行する。
// dotenv は既に設定済みの process.env を上書きしないので、CI のように
// ジョブの環境変数として DATABASE_URL 等を渡す場合はそちらが優先される。
config({ path: resolve(import.meta.dirname, '../.env.test') });
