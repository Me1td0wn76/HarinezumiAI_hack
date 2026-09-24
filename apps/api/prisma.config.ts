import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'pnpm prisma:seed',
  },
  datasource: {
    // prisma generate は DB に接続しないので、DATABASE_URL の無い CI やビルド環境でも動くよう未設定を許す。
    // migrate などの DB を使うコマンドは、未設定なら接続エラーになる
    url: process.env.DATABASE_URL ?? '',
  },
});
