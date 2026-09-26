# 発表資料（Slidev）

LT会支援アプリの発表スライド。本文は [slides.md](slides.md)、配色はアプリの `apps/web/src/app/globals.css` に合わせてある。

アプリの workspace には含めていない（Render / Vercel のビルドに Slidev の依存を入れないため）。このフォルダの中でインストールする。

```bash
cd slides
pnpm install
pnpm dev       # http://localhost:3030 （発表者モードは /presenter）
pnpm build     # dist/ に静的サイトを出力
```

PDF にするときは、先に `pnpm add -D playwright-chromium` を入れてから `pnpm export` を実行する。

## 構成

| パス | 内容 |
| --- | --- |
| `slides.md` | スライド本文。各スライド末尾の `<!-- -->` は発表者ノート |
| `style.css` | 全体の見た目（見出しのマーカー、カード、表など） |
| `layouts/hero.vue` | 表紙と締めの、黄色い帯のレイアウト |
| `slide-bottom.vue` | 各スライド下のアプリ名とページ番号 |
| `components/` | 稲妻（`Bolt`）、アプリと同じアイコン（`LtIcon`）、カーソルから逃げるアイコン（`FleeingIcons`）、ブラウザ枠つきのスクリーンショット（`Screen`） |
| `lib/lt-icons.ts` | `apps/web/src/components/lt-icons.ts` の写し |
| `public/screens/` | アプリのスクリーンショット（1280×720、seed データ、`demo@example.com` でログイン） |

## スクリーンショットの撮り直し

画面を変えたら、ルートで `pnpm dev` を起動し、`playwright-cli` で撮り直す（ルートの CLAUDE.md 参照）。
`resize 1280 720` と `set-reduced-motion reduce` を指定し、撮る前に Next.js の開発用インジケーター（`nextjs-portal`）を消しておく。
