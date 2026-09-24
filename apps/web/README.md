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
  lib/events.ts           React.cache でまとめた LT会の取得（page と generateMetadata で共有）
  lib/og-image.tsx        OG 画像の描画。日本語フォントは Google Fonts のサブセットを実行時に取得（lib/og-font.ts）
```

OGP: `/events/[id]` と `/share/[token]` に `opengraph-image.tsx` がある。`/share/[token]` は `noindex` で、canonical は `/events/[id]` に向けている。

ブラウザから NestJS を直接呼ばず、常に Next.js サーバーを経由する（BFF）。
JWT は httpOnly Cookie `lt_token` に保持するのでクライアント JS からは見えない。
