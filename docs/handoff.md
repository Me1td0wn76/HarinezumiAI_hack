# 引き継ぎ資料（2026-09-24 15:00 時点）

複数の Claude セッションで並行作業した日の終わりに、次の担当者（人・エージェント）向けにまとめたもの。
PR やブランチの状態はこの時点のスナップショットなので、着手前に `gh pr list` と `git worktree list` で最新を確認すること。

## まず読むこと

- 作業の進め方は [CLAUDE.md](../CLAUDE.md)、設計判断は [open-questions.md](open-questions.md)
- **worktree で作業する**: 1 PR = 1 worktree（`git worktree add ../wt-<番号> <branch>`）。メインのチェックアウトで別ブランチに切り替えない
- **マージは1人に集約する**: 複数人が同時にマージすると後続 PR の競合が連鎖する。マージしたら、後続 PR が競合していないか確認して担当に伝える
- **ローカル DB に他人のブランチのマイグレーションを適用しない**。確認はユニットテストと CI（本物の Postgres）で行う
- worktree で `prisma generate` するときは、`apps/api/.env` が無いので `DATABASE_URL` にダミー値を入れる（接続はしない）
- `apps/web` の `tsc --noEmit` は `next typegen` を実行していないと PageProps / LayoutProps で落ちる（既知で、変更とは無関係）
- API に prettier をかけるのは変更したファイルだけにする（既存コードはまだ printWidth 120 で整形されていない。#35 参照）
- worktree の削除: `node_modules` があると Windows のパス長で `git worktree remove` が失敗する。`robocopy <空フォルダ> <wt> /MIR` で空にしてから削除する

## 決定事項（PR #35 の論点）

1. `apps/api/.prettierrc` は `printWidth: 120` と `endOfLine: "auto"` にする
2. 既存の3ファイル（`events.controller.ts` / `events.mapper.ts` / `events.service.spec.ts`）の整形は、オープン中の PR が片付いてから単独の PR にする
3. `apps/web` の prettier は設定だけ先に入れ、触ったファイルから順に揃える
4. マージ順: **#35 → #22 → #23 → #24 → #27 → #29 → #30 → #31 → #33 → #34 → #36 → #37**。条件（CI 緑・レビュー指摘に対応済み・競合なし）を満たさないものは飛ばして次へ進む

※ #35 への決定コメントはまだ投稿していない（権限で止まった）。

## PR 一覧と次の一手

| PR | Issue | 状態 | 次の一手 |
| --- | --- | --- | --- |
| #35 | - | **マージ可**（CI 緑、競合なし） | 決定事項をコメントしてマージ |
| #22 | #16 発見機能 | **マージ可**（CI pass e11ab12、競合なし） | マージ。PGlite には pg_trgm が無く、ローカルではマイグレーションが失敗する（PR の説明に記載あり） |
| #23 | #17 開催形式 | **#22 の後にマージ可**（CI pass 091065f） | #22 マージ後に base が main に変わる。競合したら `wt-17-event-format` で `git merge origin/main` → push |
| #24 | #20 共有・OGP | 可（CI pass 07a633f） | CI が #28・#32 のマージ前の main で走っている。main を取り込んで CI を回し直し、X 共有の件への対応を確認してからマージ |
| #27 | #6 終了操作 | 競合あり（作者 Sabigon-MA） | 作者の対応待ち。こちらから push しない |
| #25 | #8 フォロー（作者 Tongari-Boy） | 要修正1件（関係ないファイルの整形を main に戻す） | 作者の対応待ち。`findManyByOrganizer` が #34 と重複しているので、片方を消す |
| #29 | #9 コメント欄 | 指摘に対応済み（2282728）、CI 結果待ち | CI 緑ならマージ可。#33 と揃えて `commentPosted` に `webhookUrl` を渡す調整が、後からマージする側で必要。#31 のマージ後は `findVisibleOrThrow` に差し替える |
| #30 | #19 前半（レート制限・規約） | **未着手**（レビュー指摘あり） | worktree を作る → レビューを読んで修正 → main を取り込む → push。`THROTTLE.comment`（10 回/分程度）も追加 |
| #31 | #19 後半（通報・ブロック・非表示） | CI 失敗。`wt-31` でマージ途中（未コミット） | 下の「#31 の残作業」参照 |
| #33 | #12 Webhook | **マージ可**（ae レビュー、要修正なし） | 任意: `allowed_mentions: { parse: [] }`、fetch に `redirect: 'error'`、テスト送信ボタン |
| #34 | #15 履歴 | **マージ可**（ae レビュー、要修正なし） | 任意: /me の取得を `Promise.all` に、`take: 50`、「参加」の定義を決める。#31 のマージ後に participated に `hiddenAt: null` |
| #36 | #11 パスワード再設定 | 競合あり。**未着手** | worktree を作る → main を取り込む → lint/test → push。#30 のマージ後に `password-reset/request` に `@Throttle` |
| #37 | #3 Google ログイン | **要修正2件**（レビューは PR に未投稿） | 下の「#37 のレビュー結果」参照 |

### #31 の残作業（worktree `wt-31`、branch `feature/19-report-block-admin`）

origin/main のマージと競合の解消（`app.module.ts` / `nav.tsx` / `docs/api.md` / `packages/shared/src/types.ts`。どれも両方の変更を残した）までは済んでいて、**マージはまだコミットしていない**。

1. `src/modules/events/events.service.spec.ts`: providers に `{ provide: BlocksRepository, useValue: { findBlockedIds: vi.fn().mockResolvedValue([]) } }` を追加
2. `src/modules/responses/responses.service.spec.ts`: events のモックに `findVisibleOrThrow` を追加し、`submitForUser` のテスト5件を `findVisibleOrThrow` に切り替える（`submitForGuest` は `findOrThrow` のまま）
3. `src/test-support/event-factories.ts`: `buildUser` に `role: 'USER'`、`buildEvent` に `hiddenAt: null`
4. `src/modules/schedule/schedule.repository.ts` の `findForUser`: 回答者として関わる側の条件に `hiddenAt: null` を追加（主催者本人の分は残す）
5. `pnpm --filter @lt/api test` と lint → マージをコミット → push

※ 担当セッションでは spec の編集が権限の自動判定で拒否された。ユーザーの許可を得てから進めること。

### #37 のレビュー結果（PR には未投稿）

- **要修正1**: main と競合（`README.md`、`packages/shared/src/types.ts` の #32 `ScheduleItemDto` 付近）。そのため CI が走っていない
- **要修正2（セキュリティ）**: 既存アカウントへの自動紐付けで事前乗っ取りが起きる。`/auth/register` はメールの所有を確認しないので、攻撃者が被害者のメールで先に登録しておくと、被害者の Google ログインがそのアカウントに紐付き、攻撃者は元のパスワードでログインし続けられる。対策: 紐付け時に `passwordHash` を NULL にする（#36 の再設定で設定し直せる）か、自動紐付けをやめて 409 を返す。紐付けと更新は同じ `$transaction` で行い、テストも追加する
- 軽微: 同時コールバックで P2002 → 500 になる / #30 のマージ後に OAuth にもレート制限と規約同意の扱い / #36 との整合（Google 専用ユーザーのパスワード設定）/ `authorizeUrl` のインデント
- 問題なし: 3層構成、ESM の拡張子、shared の型、state / PKCE。lint・web の型チェック・ユニットテスト5件は pass
- 本物の Google OAuth クライアントでの通し確認がまだ（ユーザーが用意する必要あり）

## 作業中の Issue

### #14 デプロイ構成（branch `feature/14-deploy`、push 済み dc737e3、PR はまだ）

済: api の build 内で `prisma generate`、`prisma.config.ts` は `DATABASE_URL` なしでも generate できる、`start:deploy` = `prisma migrate deploy` + `node dist/main.js`（`/health` の応答まで確認済み）

1. ルートに `render.yaml` を追加
   - build: `pnpm install --frozen-lockfile && pnpm --filter @lt/api build`
   - start: `pnpm --filter @lt/api start:deploy`
   - health check: `/health`
   - `NODE_VERSION` 22
   - env: `DATABASE_URL` / `JWT_SECRET` / `WEB_ORIGIN` / `WEB_URL` / `DISCORD_WEBHOOK_URL`（#30 のマージ後に `TRUST_PROXY`）
2. `docs/deploy.md` を書く: Neon での DB 作成、Render の手順、Vercel の設定（Root Directory は `apps/web`、env は `API_URL` と `NEXT_PUBLIC_WEB_URL`）
3. 任意: `.github/workflows/ci.yml` を整備（install / lint / api tsc / vitest / web build。`DATABASE_URL` は不要）
4. `Closes #14` で PR を作る

### まだ手を付けていない範囲

- #3 の GitHub / X ログイン（#37 は Google だけ。`Refs #3`）
- #15 の開催後フィードバック（#34 は履歴だけ。`Refs #15`）
- マージ後の後続作業
  - #22・#23 の後: #28 の編集ページ（`EventEditForm` / `updateEvent`）にタグ・開催形式・会場・配信URL の欄を足す
  - #31 の後: `ScheduleRepository.findForUser` と #34 の participated に `hiddenAt: null`、#29 の `findVisibleOrThrow`
  - 全 PR の後: `pnpm --filter @lt/api format` を単独の PR にする

## マージ時の注意

- マイグレーションを追加する PR: #29 #30 #31 #33 #36 #37。タイムスタンプは重ならないが、`schema.prisma` の User モデル付近で競合する。マージのたびに `prisma validate` で確認する
- #23 でゲストの `responderKey` が `guest:<guestKey の SHA-256>` に変わった（web 側は `lib/guest-key.ts`）。guestKey を扱う PR とぶつかる可能性がある
- フォークの PR（#25・#27）は作者に任せる

## ユーザーの判断待ち

1. PR へのマージとコメント（`gh pr merge` / `gh pr comment`）が、エージェントの権限の自動判定で拒否された。ユーザーが自分で実行するか、許可を出す必要がある
2. #31 の spec と factory の編集の許可
3. #37 の本物の Google OAuth クライアントの用意
4. #30 のマージ後、Google 登録時の利用規約への同意をどう扱うか

## 残っている worktree（すべて `C:\Users\244079\Desktop\workspace\`）

| パス | ブランチ | 状態 |
| --- | --- | --- |
| `HarinezumiAI_hack`（メイン） | feature/14-deploy | clean。`pnpm dev`（:3000/:3001）と使い捨ての PGlite（:5432）が動いたまま。止めてよい |
| `wt-16-discovery` | feature/16-discovery | clean |
| `wt-17-event-format` | feature/17-event-format | clean |
| `wt-20-share-ogp` | feature/20-share-ogp | clean |
| `wt-29` | feature/9-event-comments | clean |
| `wt-31` | feature/19-report-block-admin | **マージ途中・未コミット**。消さないこと |
| `wt-merge` | detached（#37 の head）、一時ブランチ pr37-check | 変更なし。不要なら削除 |
| `wt-handoff` | docs/handoff-2026-09-24 | この資料 |
