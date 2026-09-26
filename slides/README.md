# 発表資料（Slidev）

LT会支援アプリの発表スライド（5 分・8 枚）。テーマ「AI（アイ）」を「出会い」と捉えた構成で、各スライドの発表者ノートに目安の時間と台本、デモの手順を書いてある。
本文は [slides.md](slides.md)、配色はアプリの `apps/web/src/app/globals.css` に合わせてある。

アプリの workspace には含めていない（Render / Vercel のビルドに Slidev の依存を入れないため）。このフォルダの中でインストールする。

```bash
cd slides
pnpm install
pnpm dev       # http://localhost:3030 （発表者モードは /presenter）
pnpm build     # dist/ に静的サイトを出力
```

PDF にするときは、先に `pnpm add -D playwright-chromium` を入れてから `pnpm export` を実行する。

## 公開（GitHub Pages）

`main` に `slides/` の変更を push すると、[.github/workflows/slides.yml](../.github/workflows/slides.yml) がビルドして https://me1td0wn76.github.io/HarinezumiAI_hack/ に公開する（Actions の画面から手動でも実行できる）。
初回だけ、リポジトリの Settings → Pages → Build and deployment の Source を「GitHub Actions」にしておく。

Pages はサブパスで配信されるので、ビルドには `--base /HarinezumiAI_hack/` を付けている。
ローカルの Git Bash で同じビルドを試すときは、`/HarinezumiAI_hack/` が Windows のパスに書き換えられないよう `MSYS_NO_PATHCONV=1` を付ける。

## 構成

| パス | 内容 |
| --- | --- |
| `slides.md` | スライド本文。各スライド末尾の `<!-- -->` は発表者ノート |
| `style.css` | 全体の見た目（見出しのマーカー、カード、各スライドの部品） |
| `layouts/hero.vue` | 表紙と締めの、黄色い帯のレイアウト。frontmatter の `mascot: hedgehog` でハリネズミを出す |
| `slide-bottom.vue` | 各スライド下のアプリ名とページ番号 |
| `components/` | 稲妻（`Bolt`）、アプリと同じアイコン（`LtIcon`）、カーソルから逃げるアイコン（`FleeingIcons`）、読み込み中の画面のハリネズミ（`LoadingHedgehog`）、メンバー紹介のカード（`Member`）、ブラウザ枠つきのスクリーンショット（`Screen`） |
| `lib/lt-icons.ts` | `apps/web/src/components/lt-icons.ts` の写し |
| `lib/lt-loading.css` | `apps/web/src/app/globals.css` の「読み込み中の画面」の写し。アプリ側を変えたら写し直す |
| `public/members/` | メンバー紹介に載せる GitHub のアイコン（発表会場がオフラインでも出るよう、ダウンロードして置いている） |
| `public/screens/` | デモのスライドに載せるアプリのスクリーンショット（1280×720 で撮影し一部を切り抜き。seed データ、`demo@example.com` でログイン） |

## スクリーンショットの撮り直し

画面を変えたら、ルートで `pnpm dev` を起動し、`playwright-cli` で撮り直す（ルートの CLAUDE.md 参照）。
`resize 1280 720` と `set-reduced-motion reduce` を指定し、撮る前に Next.js の開発用インジケーター（`nextjs-portal`）を消しておく。
