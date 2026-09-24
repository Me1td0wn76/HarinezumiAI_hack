# デプロイ手順

本番は次の3つのサービスに分けて置く。どれも無料枠で動く。

| 役割 | サービス | 中身 |
| --- | --- | --- |
| DB | [Neon](https://neon.tech) | PostgreSQL 17 |
| API | [Render](https://render.com) | `apps/api`（NestJS）。設定はルートの `render.yaml` |
| Web | [Vercel](https://vercel.com) | `apps/web`（Next.js） |

ブラウザは Vercel の Next.js とだけ通信し、Next.js のサーバー側が `API_URL` で Render の API を呼ぶ（BFF 構成）。
そのため Render の API は外から見えていても、ブラウザから直接叩かれる前提にはしていない。

レイテンシを抑えるため、3つのリージョンはそろえる（例: Neon `AWS Asia Pacific (Singapore)` / Render `Singapore` / Vercel Functions `sin1`）。

作業は **Neon → Render → Vercel → Render の env を Vercel の URL で埋める** の順に行う。

## 1. Neon（DB）

1. Neon でプロジェクトを作る。Postgres のバージョンは 17、リージョンは Singapore
2. Dashboard の **Connect** で接続文字列をコピーする
   - **Connection pooling はオフ（直接接続）** の文字列を使う。`prisma migrate deploy` は advisory lock を使うので、pooler（`-pooler` の付くホスト）経由だと失敗することがある
   - 末尾に `?sslmode=require` が付いていることを確認する
3. この文字列を Render の `DATABASE_URL` に入れる（次の節）。マイグレーションは Render の起動時に自動で適用される

デモデータ（`pnpm db:seed`）は本番には入れない。入れる場合はローカルから `DATABASE_URL` を Neon に向けて実行する。

## 2. Render（API）

1. Render の **New → Blueprint** でこのリポジトリを選ぶ。ルートの `render.yaml` が読み込まれ、`lt-api` という Web Service が作られる
2. `sync: false` の環境変数は作成時に入力を求められる

| 変数 | 値 |
| --- | --- |
| `DATABASE_URL` | Neon の直接接続の文字列 |
| `WEB_ORIGIN` | Vercel の本番 URL（例: `https://lt-app.vercel.app`）。まだ無ければ仮の値で作り、後で直す |
| `WEB_URL` | 同上。Discord 通知のリンクに使う |
| `DISCORD_WEBHOOK_URL` | 任意。空なら通知しない |

`JWT_SECRET` は Render が自動生成する。`PORT` は Render が注入するので設定しない。`NODE_VERSION` は 22 に固定している。

`render.yaml` の中身:

- Build: `pnpm install --frozen-lockfile && pnpm --filter @lt/api build`
  - ルートの `postinstall` で `packages/shared` がビルドされ、api の `build` の中で `prisma generate` が走る（`DATABASE_URL` は不要）
- Start: `pnpm --filter @lt/api start:deploy`（`prisma migrate deploy` → `node dist/main.js`）
- Health check: `/health`
- `main` への push で自動デプロイ

注意:

- `NODE_ENV=production` を環境変数に入れない。ビルド時の `pnpm install` が devDependencies（Nest CLI・Prisma CLI）を入れなくなり、ビルドが落ちる
- Free プランは 15 分アクセスが無いとスリープし、次のリクエストで起動に数十秒かかる。スリープ中の最初の画面表示が遅いのはこのため
- デプロイ後、`https://<service>.onrender.com/health` が応答すれば API は動いている

## 3. Vercel（Web）

1. **Add New → Project** でこのリポジトリを選ぶ
2. 設定

| 項目 | 値 |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Include files outside of the Root Directory | オン（`packages/shared` を使うため。既定でオン） |
| Install Command | 既定のまま（pnpm workspace を検出してルートで install する） |
| Build Command | 既定のまま（`next build`）。`@lt/shared` が見つからないエラーになる場合は `pnpm --filter @lt/shared build && next build` にする |

3. 環境変数（Production と Preview の両方）

| 変数 | 値 |
| --- | --- |
| `API_URL` | Render の URL（例: `https://lt-api.onrender.com`）。末尾の `/` は付けない |
| `NEXT_PUBLIC_WEB_URL` | Vercel の本番 URL（例: `https://lt-app.vercel.app`）。共有リンクと OGP の絶対 URL に使う |

`NEXT_PUBLIC_` の付く変数はビルド時に埋め込まれるので、変えたら再デプロイする。
`NODE_ENV` は Vercel が `production` にするので、ログイン Cookie には `Secure` が付く。

4. Functions のリージョンを Settings → Functions で `sin1`（Singapore）にする

## 4. 仕上げ

1. Vercel の本番 URL が決まったら、Render の `WEB_ORIGIN` と `WEB_URL` をその URL にして再デプロイする
2. 動作確認
   - `/register` でユーザーを作り、ログインできる
   - イベントを作り、共有 URL をログアウト状態で開いて回答できる
   - `DISCORD_WEBHOOK_URL` を設定した場合は、開催日の確定で通知が届く

## トラブルシューティング

| 症状 | 原因と対処 |
| --- | --- |
| Render のビルドで `pnpm: command not found` | Build Command の先頭に `corepack enable pnpm && ` を付ける（`package.json` の `packageManager` の版が使われる） |
| Render の起動で `P1001`（DB に届かない） | `DATABASE_URL` の誤り。`sslmode=require` が付いているか、Neon のプロジェクトが停止していないか確認する |
| Render の起動で migrate がタイムアウトする | pooler の接続文字列を使っている。直接接続に変える |
| Web の画面が 500 になり、ログに `fetch failed` | `API_URL` の誤りか、Render がスリープから起きていない。`/health` を開いて起こしてから再読み込みする |
| 共有リンクや OGP 画像が `localhost` になる | `NEXT_PUBLIC_WEB_URL` の未設定。設定して再デプロイする |
