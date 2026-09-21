# @lt/api

NestJS 12 + Prisma 7 の REST API。ルートの README を参照。

```
src/
  main.ts                 起動・CORS・ValidationPipe
  app.module.ts           モジュールの束ね
  prisma/                 PrismaService（DI 用）と seed
  common/                 ガード・デコレータ
  modules/
    auth/                 登録・ログイン（JWT 発行）、JwtStrategy
    users/                プロフィール
    events/               LT会の CRUD、候補日、開催日決定
    responses/            候補日への回答（ログインユーザー）
    share/                共有URL 経由の閲覧・ゲスト回答
    notifications/        Discord Webhook 通知
  generated/prisma/       prisma generate の出力（git 管理外）
```

各モジュールは Controller（HTTP）→ Service（業務ルール）→ Repository（Prisma）の順に依存する。
レスポンスの形は `packages/shared` の型に合わせ、`*.mapper.ts` で Prisma の型から変換する。
