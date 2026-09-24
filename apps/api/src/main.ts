import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ブラウザからのリクエストは web（BFF）経由で届くため、接続元 IP は常に web サーバーになる。
  // レート制限を利用者ごとに掛けられるよう、web が付ける X-Forwarded-For を信頼して req.ip を利用者の IP にする。
  // 信頼するプロキシは TRUST_PROXY で指定する（Express の trust proxy と同じ書式。数字ならホップ数）
  const trustProxy = process.env.TRUST_PROXY ?? 'loopback';
  app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

  // ブラウザから直接 API を叩く場合（将来のスマホアプリ等）に備えて CORS を許可する
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  configureApp(app);

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
