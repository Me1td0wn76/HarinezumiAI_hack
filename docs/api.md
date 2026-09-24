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
| GET | `/events` | - | LT会一覧（新しい順） | `EventSummaryDto[]` |
| POST | `/events` | 必須 | LT会作成（`CreateEventRequest`）。Discord 通知 + 主催者以外の全ユーザーにアプリ内通知 | `EventDetailDto` |
| GET | `/events/:id` | 任意 | LT会詳細。主催者本人には `shareToken` を含める | `EventDetailDto` |
| PATCH | `/events/:id` | 主催者 | タイトル・説明の更新（`UpdateEventRequest`） | `EventDetailDto` |
| DELETE | `/events/:id` | 主催者 | LT会削除 | 204 |
| POST | `/events/:id/dates` | 主催者 | 候補日追加（`{ candidateDates }`）。OPEN のときのみ | `EventDetailDto` |
| DELETE | `/events/:id/dates/:dateId` | 主催者 | 候補日削除。決定済みの日は不可 | `EventDetailDto` |
| POST | `/events/:id/confirm` | 主催者 | 開催日決定（`ConfirmEventRequest`）。Discord 通知 + 回答したログインユーザーにアプリ内通知 | `EventDetailDto` |
| PUT | `/events/:id/responses` | 必須 | 自分の回答を一括登録・更新（`SubmitResponsesRequest`）。OPEN のときのみ | `EventDetailDto` |
| GET | `/share/:token` | - | 共有URL からの閲覧 | `EventDetailDto`（`shareToken` は null） |
| PUT | `/share/:token/responses` | - | ゲスト回答（`SubmitGuestResponsesRequest`）。`guestKey` が同じなら更新 | `EventDetailDto` |
| GET | `/notifications` | 必須 | 自分宛てのアプリ内通知（新しい順、30件ずつ）。`?before=<nextCursor>` で続きを取る | `NotificationListDto` |
| GET | `/notifications/unread-count` | 必須 | 未読件数（ヘッダーのバッジ用） | `UnreadCountDto` |
| POST | `/notifications/:id/read` | 必須 | 既読にする。他人の通知は 404 | `NotificationDto` |
| POST | `/notifications/read-all` | 必須 | 自分宛てをすべて既読にする | 204 |

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
| 404 | LT会・候補日・通知が存在しない |
| 409 | メールアドレス重複 |

## 回答者の識別

`EventDetailDto.responders[].responderKey` は、ログインユーザーなら `user.id`、ゲストなら `guest:<guestKey>`。
web 側はこれで「自分の行」を見つけて強調表示・初期値の復元をしている。
