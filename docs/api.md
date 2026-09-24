# REST API 一覧

ベースURL: `http://localhost:3001`（`apps/api`）。
認証が必要なエンドポイントは `Authorization: Bearer <accessToken>` を付ける。
リクエスト/レスポンスの型は [packages/shared/src/types.ts](../packages/shared/src/types.ts) を参照。

| メソッド | パス | 認証 | 内容 | レスポンス |
| --- | --- | --- | --- | --- |
| GET | `/health` | - | 死活監視 | `{ ok: true }` |
| POST | `/auth/register` | - | ユーザー登録（`RegisterRequest`） | `AuthResponse` |
| POST | `/auth/login` | - | ログイン（`LoginRequest`） | `AuthResponse` |
| GET | `/auth/oauth/providers` | - | 使えるソーシャルログイン | `OAuthProvidersDto` |
| GET | `/auth/oauth/:provider/url` | - | 認可画面の URL（`?state=&codeChallenge=`）。未設定なら 503 | `OAuthAuthorizeUrlDto` |
| POST | `/auth/oauth/:provider` | - | 認可コードでログイン / 登録（`OAuthLoginRequest`）。同じメールのアカウントが既にあれば 409（自動では紐付けない）。プロバイダでメール未確認なら 403 | `AuthResponse` |
| GET | `/users/me` | 必須 | 自分の情報 | `UserDto` |
| PATCH | `/users/me` | 必須 | プロフィール更新（`UpdateProfileRequest`） | `UserDto` |
| GET | `/users/me/schedule` | 必須 | 自分が主催・回答したLT会の日程（確定済みは開催日、調整中は候補日。開始順） | `ScheduleItemDto[]` |
| GET | `/events` | - | LT会一覧（新しい順、カーソルページネーション）。クエリは下記 | `PageDto<EventSummaryDto>` |
| GET | `/tags` | - | 使用回数の多いタグ（`?limit=30`、最大 100） | `TagCountDto[]` |
| POST | `/events` | 必須 | LT会作成（`CreateEventRequest`、`tags` は最大 5 個、`format` 省略時は ONLINE）。Discord 通知 | `EventDetailDto` |
| GET | `/events/:id` | 任意 | LT会詳細。主催者本人には `shareToken` を含める | `EventDetailDto` |
| PATCH | `/events/:id` | 主催者 | タイトル・説明・タグ・開催形式・会場・配信URL の更新（`UpdateEventRequest`。`tags` を渡すと丸ごと置換） | `EventDetailDto` |
| DELETE | `/events/:id` | 主催者 | LT会削除 | 204 |
| POST | `/events/:id/dates` | 主催者 | 候補日追加（`{ candidateDates }`）。OPEN のときのみ | `EventDetailDto` |
| DELETE | `/events/:id/dates/:dateId` | 主催者 | 候補日削除。決定済みの日は不可 | `EventDetailDto` |
| POST | `/events/:id/confirm` | 主催者 | 開催日決定（`ConfirmEventRequest`）。Discord 通知 | `EventDetailDto` |
| PUT | `/events/:id/responses` | 必須 | 自分の回答を一括登録・更新（`SubmitResponsesRequest`）。OPEN のときのみ | `EventDetailDto` |
| GET | `/events/:id/comments` | - | コメント一覧（古い順） | `EventCommentDto[]` |
| POST | `/events/:id/comments` | 必須 | コメント投稿（`CreateCommentRequest`、1〜1000文字）。Discord 通知 | `EventCommentDto` |
| DELETE | `/events/:id/comments/:commentId` | 投稿者・主催者 | コメント削除 | 204 |
| GET | `/share/:token` | - | 共有URL からの閲覧。`?guestKey=` を付けると、そのゲストが回答済みなら開催日決定後に `meetingUrl` が含まれる | `EventDetailDto`（`shareToken` は null） |
| PUT | `/share/:token/responses` | - | ゲスト回答（`SubmitGuestResponsesRequest`）。`guestKey` が同じなら更新 | `EventDetailDto` |

## `GET /events` のクエリ（`EventListQuery`）

| パラメータ | 内容 |
| --- | --- |
| `cursor` | 前ページの `nextCursor`（不透明な文字列。中身は前ページ最後の `createdAt` と `id`）。省略で先頭から。途中のイベントが削除されても続きを取れる |
| `limit` | 1〜50。既定 20 |
| `tag` | タグで絞り込み（正規化済みの小文字） |
| `q` | タイトル・説明の部分一致（大文字小文字を区別しない。pg_trgm の GIN index が効く） |
| `status` | `OPEN` / `CONFIRMED` / `CLOSED` |
| `format` | `ONLINE` / `OFFLINE` / `HYBRID` |
| `organizerId` | 主催者で絞り込み。ユーザーページや「フォロー中」フィード（#8）の土台 |

レスポンスは `{ items, nextCursor }`。`nextCursor` が `null` なら末尾。
並びは `createdAt desc, id desc` で固定なので、ページをまたいでも重複・欠落しない。

タグは API 側で正規化する: 前後の空白と先頭の `#` を除去、英字は小文字化、重複除去。
空白・カンマを含むもの、20 文字超、6 個以上は 400。

## 開催形式（`format` / `venue` / `meetingUrl`）

- `format` は `ONLINE`（既定）/ `OFFLINE` / `HYBRID`
- 形式に合わない項目は API 側で落とす: ONLINE なら `venue` を null に、OFFLINE なら `meetingUrl` を null にする。PATCH で形式を変えたときも同様
- `meetingUrl` は `http(s)://` 必須（400）
- **`meetingUrl` の出し分け**（`EventDetailDto`）: 主催者にはいつでも返す。回答者には開催日決定（CONFIRMED）後にだけ返す。それ以外は null。
  設定されているのに閲覧者に見せられない場合は `hasMeetingUrl: true` になるので、UI は「決定後に表示」と案内できる
- ゲスト（共有URL）は `GET /share/:token?guestKey=` で回答済みかを判定する

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

`EventDetailDto.responders[].responderKey` は、ログインユーザーなら `user.id`、ゲストなら `guest:<guestKey の SHA-256（16進）>`。
guestKey は知っていれば回答の上書きや配信URL の取得ができる合言葉なので、公開する一覧にはハッシュだけを載せる。
web 側はこれで「自分の行」を見つけて強調表示・初期値の復元をしている。
