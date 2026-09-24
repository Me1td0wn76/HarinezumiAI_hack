# REST API 一覧

ベースURL: `http://localhost:3001`（`apps/api`）。
認証が必要なエンドポイントは `Authorization: Bearer <accessToken>` を付ける。
リクエスト/レスポンスの型は [packages/shared/src/types.ts](../packages/shared/src/types.ts) を参照。

| メソッド | パス | 認証 | 内容 | レスポンス |
| --- | --- | --- | --- | --- |
| GET | `/health` | - | 死活監視 | `{ ok: true }` |
| POST | `/auth/register` | - | ユーザー登録（`RegisterRequest`） | `AuthResponse` |
| POST | `/auth/login` | - | ログイン（`LoginRequest`） | `AuthResponse` |
| GET | `/users/me` | 必須 | 自分の情報 | `UserDto` |
| PATCH | `/users/me` | 必須 | プロフィール更新（`UpdateProfileRequest`） | `UserDto` |
| GET | `/users/me/schedule` | 必須 | 自分が主催・回答したLT会の日程（確定済みは開催日、調整中は候補日。開始順） | `ScheduleItemDto[]` |
| GET | `/events` | - | LT会一覧（新しい順、カーソルページネーション）。クエリは下記 | `PageDto<EventSummaryDto>` |
| GET | `/tags` | - | 使用回数の多いタグ（`?limit=30`、最大 100） | `TagCountDto[]` |
| POST | `/events` | 必須 | LT会作成（`CreateEventRequest`、`tags` は最大 5 個）。Discord 通知 | `EventDetailDto` |
| GET | `/events/:id` | 任意 | LT会詳細。主催者本人には `shareToken` を含める | `EventDetailDto` |
| PATCH | `/events/:id` | 主催者 | タイトル・説明・タグの更新（`UpdateEventRequest`。`tags` を渡すと丸ごと置換） | `EventDetailDto` |
| DELETE | `/events/:id` | 主催者 | LT会削除 | 204 |
| POST | `/events/:id/dates` | 主催者 | 候補日追加（`{ candidateDates }`）。OPEN のときのみ | `EventDetailDto` |
| DELETE | `/events/:id/dates/:dateId` | 主催者 | 候補日削除。決定済みの日は不可 | `EventDetailDto` |
| POST | `/events/:id/confirm` | 主催者 | 開催日決定（`ConfirmEventRequest`）。Discord 通知 | `EventDetailDto` |
| PUT | `/events/:id/responses` | 必須 | 自分の回答を一括登録・更新（`SubmitResponsesRequest`）。OPEN のときのみ | `EventDetailDto` |
| GET | `/share/:token` | - | 共有URL からの閲覧 | `EventDetailDto`（`shareToken` は null） |
| PUT | `/share/:token/responses` | - | ゲスト回答（`SubmitGuestResponsesRequest`）。`guestKey` が同じなら更新 | `EventDetailDto` |

## `GET /events` のクエリ（`EventListQuery`）

| パラメータ | 内容 |
| --- | --- |
| `cursor` | 前ページの `nextCursor`（不透明な文字列。中身は前ページ最後の `createdAt` と `id`）。省略で先頭から。途中のイベントが削除されても続きを取れる |
| `limit` | 1〜50。既定 20 |
| `tag` | タグで絞り込み（正規化済みの小文字） |
| `q` | タイトル・説明の部分一致（大文字小文字を区別しない。pg_trgm の GIN index が効く） |
| `status` | `OPEN` / `CONFIRMED` / `CLOSED` |
| `organizerId` | 主催者で絞り込み。ユーザーページや「フォロー中」フィード（#8）の土台 |

レスポンスは `{ items, nextCursor }`。`nextCursor` が `null` なら末尾。
並びは `createdAt desc, id desc` で固定なので、ページをまたいでも重複・欠落しない。

タグは API 側で正規化する: 前後の空白と先頭の `#` を除去、英字は小文字化、重複除去。
空白・カンマを含むもの、20 文字超、6 個以上は 400。

## エラー

NestJS 標準の形式。`message` は文字列か、バリデーションエラー時は文字列の配列。

```json
{ "statusCode": 400, "message": ["title must be longer than or equal to 1 characters"], "error": "Bad Request" }
```

| ステータス | 主な原因 |
| --- | --- |
| 400 | バリデーションエラー、締め切り後の回答、決定済み候補日の削除 |
| 401 | トークンなし・無効、ログイン失敗 |
| 403 | 主催者以外による操作 |
| 404 | LT会・候補日が存在しない |
| 409 | メールアドレス重複 |

## 回答者の識別

`EventDetailDto.responders[].responderKey` は、ログインユーザーなら `user.id`、ゲストなら `guest:<guestKey>`。
web 側はこれで「自分の行」を見つけて強調表示・初期値の復元をしている。
