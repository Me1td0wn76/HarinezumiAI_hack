# HarinezumiAI_hack — AI エージェント向けメモ

LT会支援アプリ（全国の誰でも使える公開サービス。SNS のような気軽さを目指す）。pnpm monorepo（`apps/web` Next.js 16 / `apps/api` NestJS 12 + Prisma 7 / `packages/shared` 共有型）。
まず [README.md](README.md) と [docs/api.md](docs/api.md) を読むこと。設計判断は [docs/open-questions.md](docs/open-questions.md) に記録済みで、蒸し返さない。

## 守る約束

- **BFF 構成**: ブラウザは Next.js とだけ通信する。API 呼び出しは `apps/web/src/lib/api.ts` の `apiFetch`（Server Component / Server Function からのみ）。クライアントから NestJS を直接叩かない
- **API の3層**: Controller（HTTP）→ Service（業務ルール）→ Repository（Prisma）。Service に `PrismaService` を直接注入しない
- **型は `packages/shared`**: API のリクエスト/レスポンス型と列挙値はここに置き、`*.mapper.ts` で Prisma の型から変換する。Prisma の enum と `shared/src/enums.ts` は一致させる
- **`apps/api` は ESM**: 相対 import は `./foo.js` のように拡張子付き
- **スキーマ変更**: `apps/api/prisma/schema.prisma` → `pnpm db:migrate`。`prisma migrate reset` は使わず、開発 DB の初期化は `TRUNCATE` + `pnpm db:seed`
- **日時**: 保存は UTC、表示は `apps/web/src/lib/format.ts` で Asia/Tokyo 固定
- コミットはユーザーが行う。頼まれない限り commit / push しない
- 本体に無い機能は GitHub Issues で管理（#3〜#20）。着手前に既存 Issue を確認する。優先度は `priority:high` > `medium` > `low`

## スキル（`.claude/skills/`）

外部から取り込んだもの。`skills-lock.json` で出所を管理し、`npx skills update` で更新できる。

| スキル | 使う場面 |
| --- | --- |
| `vercel-react-best-practices` | `apps/web` のコンポーネント・データ取得を書く／レビューするとき（waterfall、バンドル、再レンダリング） |
| `web-design-guidelines` | UI を作った後のアクセシビリティ・UX チェック（フォーム、フォーカス、コントラスト） |
| `nestjs-best-practices` | `apps/api` のモジュール追加、ガード・例外・DTO の設計、テストの書き方 |
| `prisma-client-api` | Prisma のクエリ（include / select / upsert / `$transaction`）を書くとき |
| `prisma-cli` | migrate / generate / studio などのコマンドで迷ったとき |
| `playwright-cli` | 画面の動作確認。`pnpm dev` で起動してからブラウザを操作する |

Next.js 固有のルールはスキルではなく、`next dev` が生成する [apps/web/AGENTS.md](apps/web/AGENTS.md) と `node_modules/next/dist/docs/` を参照する（Next.js 16.3 以降の公式方式）。

### playwright-cli の使い方

グローバルではなくルートの devDependency として入れている。スキル内の `playwright-cli ...` は `pnpm exec playwright-cli ...` と読み替える。
設定は `.playwright/cli.config.json`（Edge の headless、ja-JP、Asia/Tokyo）。ブラウザのダウンロードは不要。

```bash
pnpm dev                                          # web:3000 / api:3001
pnpm exec playwright-cli open http://localhost:3000/
pnpm exec playwright-cli snapshot                 # ref 付きのアクセシビリティツリー
pnpm exec playwright-cli click e14                # ref で操作
pnpm exec playwright-cli screenshot
pnpm exec playwright-cli close
```

ログインが必要な画面は、`/register` か `/login` から操作して Cookie を得る（デモ: `demo@example.com` / `password123`）。

## この環境（Windows）での注意

- 日本語を含む文字列をコマンドライン引数で渡すと化ける。JSON やボディはファイルに書いて `--data-binary @file` / `gh api --input file` で渡す
- 1回の Bash 呼び出しで書く heredoc は 150 行程度まで。長いファイルは分割して書く
