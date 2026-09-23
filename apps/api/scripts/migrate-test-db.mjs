// .env.test（lt_test）に対して既存のマイグレーションを適用する（prisma migrate deploy）。
import { config } from 'dotenv';
import { execSync } from 'node:child_process';

const { error } = config({ path: new URL('../.env.test', import.meta.url) });
if (error) {
  // .env.test が無いと DATABASE_URL が未設定のまま prisma migrate deploy が動き、
  // prisma.config.ts の import 'dotenv/config' が読む apps/api/.env（開発DB）に適用されてしまう
  console.error('apps/api/.env.test がありません。cp apps/api/.env.test.example apps/api/.env.test を実行してください');
  process.exit(1);
}

execSync('prisma migrate deploy', { stdio: 'inherit', env: process.env });
