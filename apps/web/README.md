# @lt/web

Next.js 16（App Router）のフロントエンド。ルートの README を参照。

```
src/
  app/                    ページ（Server Component）
  actions/                Server Functions（フォーム送信 → API 呼び出し → revalidate）
  components/             UI 部品。フォームは "use client"
  lib/api.ts              サーバー側から API を呼ぶ apiFetch（Cookie の JWT を付与）
  lib/auth.ts             getCurrentUser / requireUser / Cookie 操作
  lib/format.ts           日時の表示（Asia/Tokyo 固定）と datetime-local → ISO 変換
```

ブラウザから NestJS を直接呼ばず、常に Next.js サーバーを経由する（BFF）。
JWT は httpOnly Cookie `lt_token` に保持するのでクライアント JS からは見えない。
