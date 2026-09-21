# HarinezumiAI_hack

LT会を気軽に開催・参加できる環境をつくる **LT会支援Webアプリ**。

## 解決したい課題

- LT会を開催しても人が集まらない
- 人が集まりそうな日程でしか開催できない
- 主催者と参加者の日程調整に手間がかかる

## 構成（予定）

| 分類 | 技術 |
| --- | --- |
| フロントエンド | Next.js / React / TypeScript |
| バックエンド | NestJS（要再検討: [open-questions.md](./docs/open-questions.md)） |
| データベース | PostgreSQL + Prisma |
| UI | Tailwind CSS |
| 認証 | 未決定 |

## ドキュメント

- [システム設計概要](./docs/design.md) — 機能一覧、アーキテクチャ、DB設計、開発フェーズ
- [未決定事項・技術判断メモ](./docs/open-questions.md) — 着手前に決めるべき項目と推奨案

## 開発

2〜3人のチームで開発。まずはフェーズ1（アカウント・LT会作成）とフェーズ2（日程調整）を
動く状態にすることを目標とする。
