import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ブラウザから直接 API を叩く場合（将来のスマホアプリ等）に備えて CORS を許可する
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  configureApp(app);

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
