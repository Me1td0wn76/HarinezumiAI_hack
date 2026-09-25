# HarinezumiAI_hack — LT会支援Webアプリ

誰でも LT会を気軽に立てて、見つけて、参加できる Web アプリ。SNS のような気軽さを目指す。

- 発表者が発表内容と候補日を登録する
- 参加者が候補日ごとに ○ / △ / × で回答する（共有URL ならログイン不要）
- 主催者が集計を見て開催日を決める → Discord に通知

設計の背景は [docs/design.md](./docs/design.md)、決めた／決めていないことは [docs/open-questions.md](./docs/open-questions.md)、API 一覧は [docs/api.md](./docs/api.md)、本番環境（Neon / Render / Vercel）の手順は [docs/deploy.md](./docs/deploy.md) を参照。

## 構成

pnpm workspace の monorepo。

```
apps/
  web/        Next.js 16 (App Router)  — 画面。Server Functions 経由で API を呼ぶ BFF 構成
  api/        NestJS 12 + Prisma 7     — REST API。Controller → Service → Repository の3層
packages/
  shared/     API のリクエスト/レスポンス型と列挙値（web / api 両方から import）
docker-compose.yml   PostgreSQL 17
```

| 分類 | 技術 |
| --- | --- |
| フロントエンド | Next.js / React / Tailwind CSS |
| バックエンド | NestJS / Prisma / PostgreSQL |
| 認証 | メール + パスワード（bcrypt + JWT）と Google ログイン（OAuth 2.0 + PKCE）。JWT は web 側の httpOnly Cookie に保持 |
| 通知 | Discord Incoming Webhook（`DISCORD_WEBHOOK_URL` を設定した場合のみ） |

## セットアップ

必要なもの: Node.js 22 以上、pnpm 10、Docker

```bash
pnpm install

# 環境変数（そのままでローカル開発は動く）
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

pnpm db:up        # PostgreSQL を起動
pnpm db:migrate   # マイグレーション適用 + Prisma Client 生成
pnpm db:seed      # デモデータ投入（demo@example.com / password123、プロフィールは /users/demo）

pnpm dev          # web(3000) / api(3001) / shared(型の watch) を同時起動
```

http://localhost:3000 を開く。

### Google ログインを有効にする（任意）

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が未設定ならボタンは表示されず、メール + パスワードだけで動く。

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作る
2. 「API とサービス」→「OAuth 同意画面」でアプリ名・サポートメールを設定する（スコープは `openid` / `email` / `profile`）
3. 「認証情報」→「認証情報を作成」→「OAuth クライアント ID」→ 種類は「ウェブ アプリケーション」
4. 「承認済みのリダイレクト URI」に `http://localhost:3000/auth/google/callback` を追加する（本番は `<WEB_URL>/auth/google/callback`）
5. 表示されたクライアント ID とシークレットを `apps/api/.env` の `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` に書き、api を再起動する

コールバック URL は api の `WEB_URL` から組み立てるので、`WEB_URL` と Google 側の設定を一致させること。

### API の e2e テストを動かす

e2e テスト（`apps/api/test/*.e2e-spec.ts`）は本番用の `lt` とは別の `lt_test` データベースに対して実行する。

```bash
cp apps/api/.env.test.example apps/api/.env.test  # 初回のみ
pnpm db:test:up                                   # lt_test データベースを作成（既にあれば何もしない）
pnpm db:test:migrate                              # lt_test にマイグレーションを適用
pnpm test:e2e                                     # e2e テストを実行
```

GitHub Actions（`.github/workflows/ci.yml`）では push / PR ごとに `pnpm lint`・`pnpm test`（ユニット）・`pnpm --filter @lt/api test:e2e` を実行する。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 全パッケージを開発モードで起動 |
| `pnpm build` | 全パッケージをビルド |
| `pnpm lint` | 全パッケージを lint |
| `pnpm db:migrate` | `prisma migrate dev`（スキーマ変更後に実行） |
| `pnpm db:studio` | Prisma Studio で DB を見る |
| `pnpm db:test:up` / `pnpm db:test:migrate` | `lt_test` データベースの作成・マイグレーション適用 |
| `pnpm --filter @lt/api test` | API のユニットテスト（Service 層。DB 不要） |
| `pnpm test:e2e` | API の e2e テスト（`lt_test` の起動・マイグレーションが必要） |

## 開発の流れ

- スキーマを変えるとき: `apps/api/prisma/schema.prisma` を編集 → `pnpm db:migrate` → 必要なら `packages/shared` の型も更新
- API を足すとき: `apps/api/src/modules/<機能>/` に module / controller / service / repository を追加し、レスポンス型は `packages/shared` に置く
- 画面を足すとき: `apps/web/src/app/` にページ、API 呼び出しは `apps/web/src/actions/` の Server Function か `lib/api.ts` の `apiFetch`
- 整形だけのコミットを `git blame` から外す: `git config blame.ignoreRevsFile .git-blame-ignore-revs`（初回だけ）

優先度「中」「低」の機能（アプリ内通知、フォロー、連絡、団体管理、Google ログインなど）は GitHub Issues で管理し、PR ベースで進める。
