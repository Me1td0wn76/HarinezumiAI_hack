// .env.test（lt_test）に対して既存のマイグレーションを適用する（prisma migrate deploy）。
import { config } from 'dotenv';
import { execSync } from 'node:child_process';

config({ path: new URL('../.env.test', import.meta.url) });

execSync('prisma migrate deploy', { stdio: 'inherit', env: process.env });
