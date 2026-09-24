import { INestApplication, ValidationPipe } from '@nestjs/common';

/** 本番（main.ts）と e2e テストで同じ入口設定（バリデーション）を保つ */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO に無いプロパティは落とす
      transform: true, // プリミティブ型・ネストした DTO を変換する
    }),
  );
}
