# REST API 一覧

ベースURL: `http://localhost:3001`（`apps/api`）。
認証が必要なエンドポイントは `Authorization: Bearer <accessToken>` を付ける。
リクエスト/レスポンスの型は [packages/shared/src/types.ts](../packages/shared/src/types.ts) を参照。

| メソッド | パス | 認証 | 内容 | レスポンス |
| --- | --- | --- | --- | --- |
| GET | `/health` | - | 死活監視 | `{ ok: true }` |
| POST | `/auth/register` | - | ユーザー登録（`RegisterRequest`。`agreeToTerms: true` と `handle` 必須）。メールアドレスかハンドルが使用済みなら 409 | `AuthResponse` |
| POST | `/auth/login` | - | ログイン（`LoginRequest`） | `AuthResponse` |
| GET | `/auth/oauth/providers` | - | 使えるソーシャルログイン | `OAuthProvidersDto` |
| GET | `/auth/oauth/:provider/url` | - | 認可画面の URL（`?state=&codeChallenge=`）。未設定なら 503 | `OAuthAuthorizeUrlDto` |
| POST | `/auth/oauth/:provider` | - | 認可コードでログイン / 登録（`OAuthLoginRequest`）。同じメールのアカウントが既にあれば 409（自動では紐付けない）。プロバイダでメール未確認なら 403。新規登録時のハンドルはメールアドレスから仮に作る（`taro_1a2b3c` の形。本人が変更できる） | `AuthResponse` |
| POST | `/auth/password-reset/request` | - | パスワード再設定メールを送る（`RequestPasswordResetRequest`）。登録の有無に関係なく 204 | 204 |
| POST | `/auth/password-reset/confirm` | - | 新しいパスワードを設定（`ConfirmPasswordResetRequest`）。以前の JWT は無効になる | 204 |
| GET | `/users/me` | 必須 | 自分の情報 | `UserDto` |
| PATCH | `/users/me` | 必須 | プロフィール更新（`UpdateProfileRequest`）。`handle` が使用済みなら 409、`avatarUrl` は https のみ（`null` か空文字で解除）。`displayName` / `handle` に `null` は送れない（400） | `UserDto` |
| GET | `/users/me/events` | 必須 | 自分の主催・参加（回答）履歴（それぞれ新しい順に最大 50 件）。`participated` は自分が主催していない（非表示を除く）LT会のうち、候補日に1つでも回答したもの（YES / MAYBE / NO を問わない） | `MyEventsDto` |
| GET | `/users/me/schedule` | 必須 | 自分が主催・回答したLT会の日程（確定済みは開催日、調整中は候補日。開始順） | `ScheduleItemDto[]` |
| GET | `/users/:handle` | 任意 | 公開プロフィール（大文字小文字を区別しない）。主催したLT会（非表示を除く）と参加予定（候補日に回答したLT会のうち、日程調整中か開催日が未来のもの。主催分・非表示を除く）をそれぞれ新しい順に最大 50 件。ログイン時はブロックした相手が主催したLT会を除く。フォロワー数・フォロー中の数と、ログイン時は自分がフォロー中か（`isFollowing`。本人なら false）も返す。メールアドレスは返さない。存在しなければ 404 | `UserProfileDto` |
| POST | `/users/:id/follow` | 必須 | フォローする。自分自身は 400、存在しないユーザーは 404。フォロー済みでも 204 | 204 |
| DELETE | `/users/:id/follow` | 必須 | フォロー解除。フォローしていなくても 204 | 204 |
| GET | `/users/:id/followers` | - | フォロワー一覧（新しい順に最大 50 件） | `PublicUserDto[]` |
| GET | `/users/:id/following` | - | フォロー中一覧（新しい順に最大 50 件） | `PublicUserDto[]` |
| GET | `/events` | 任意 | LT会一覧（新しい順、カーソルページネーション）。非表示のLT会と、ログイン時はブロックした相手のLT会を除く。クエリは下記 | `PageDto<EventSummaryDto>` |
| GET | `/tags` | - | 使用回数の多いタグ（`?limit=30`、最大 100） | `TagCountDto[]` |
| POST | `/events` | 必須 | LT会作成（`CreateEventRequest`、`tags` は最大 5 個、`format` 省略時は ONLINE、`webhookUrl` は任意）。Discord 通知 + 全ユーザーにアプリ内通知（主催者本人と、主催者をブロックした人は除く） | `EventDetailDto` |
| GET | `/events/:id` | 任意 | LT会詳細。主催者本人には `shareToken` と `webhookUrl` を含める。非表示のLT会は主催者と運営以外 404 | `EventDetailDto` |
| PATCH | `/events/:id` | 主催者 | タイトル・説明・タグ・開催形式・会場・配信URL・Discord 通知先の更新（`UpdateEventRequest`。`tags` を渡すと丸ごと置換、`webhookUrl: null` で通知先を解除） | `EventDetailDto` |
| DELETE | `/events/:id` | 主催者 | LT会削除 | 204 |
| POST | `/events/:id/dates` | 主催者 | 候補日追加（`{ candidateDates }`）。OPEN のときのみ | `EventDetailDto` |
| DELETE | `/events/:id/dates/:dateId` | 主催者 | 候補日削除。決定済みの日は不可 | `EventDetailDto` |
| POST | `/events/:id/confirm` | 主催者 | 開催日決定（`ConfirmEventRequest`）。Discord 通知 + 回答したログインユーザーにアプリ内通知（主催者をブロックした人は除く）。同じ日で決定し直したときは通知しない | `EventDetailDto` |
| PUT | `/events/:id/responses` | 必須 | 自分の回答を一括登録・更新（`SubmitResponsesRequest`）。OPEN のときのみ | `EventDetailDto` |
| POST | `/events/:id/report` | 必須 | LT会を通報（`ReportRequest`）。同じ対象への再通報は理由の更新 | 204 |
| POST | `/users/:id/report` | 必須 | ユーザーを通報（`ReportRequest`） | 204 |
| GET | `/users/me/blocks` | 必須 | ブロック中のユーザー | `PublicUserDto[]` |
| POST | `/users/:id/block` | 必須 | ブロック | 204 |
| DELETE | `/users/:id/block` | 必須 | ブロック解除 | 204 |
| GET | `/admin/reports` | 運営 | 通報を対象ごとに集計（多い順、最大50件） | `AdminReportDto[]` |
| POST | `/admin/events/:id/hide` | 運営 | LT会を非表示（`ModerateEventRequest`）。操作ログを残す | 204 |
| POST | `/admin/events/:id/unhide` | 運営 | LT会を再表示。操作ログを残す | 204 |
| GET | `/events/:id/comments` | - | コメント一覧（古い順） | `EventCommentDto[]` |
| POST | `/events/:id/comments` | 必須 | コメント投稿（`CreateCommentRequest`、1〜1000文字）。Discord 通知 | `EventCommentDto` |
| DELETE | `/events/:id/comments/:commentId` | 投稿者・主催者 | コメント削除 | 204 |
| GET | `/share/:token` | - | 共有URL からの閲覧。`?guestKey=` を付けると、そのゲストが回答済みなら開催日決定後に `meetingUrl` が含まれる | `EventDetailDto`（`shareToken` は null） |
| PUT | `/share/:token/responses` | - | ゲスト回答（`SubmitGuestResponsesRequest`）。`guestKey` が同じなら更新 | `EventDetailDto` |
| GET | `/notifications` | 必須 | 自分宛てのアプリ内通知（新しい順、30件ずつ）。`?cursor=<nextCursor>` で続きを取る（`GET /events` と同じ不透明な文字列。壊れていれば 400）。文面は返さず、`type` と `data`（LT会名・日時など）から web 側で組み立てる。LT会を削除すると関連する通知も消える。既読から90日たった通知は毎日 4:00（日本時間）に削除する（未読は残す） | `PageDto<NotificationDto>` |
| GET | `/notifications/unread-count` | 必須 | 未読件数（ヘッダーのバッジ用） | `UnreadCountDto` |
| POST | `/notifications/:id/read` | 必須 | 既読にする。他人の通知は 404 | `NotificationDto` |
| POST | `/notifications/read-all` | 必須 | 自分宛てをすべて既読にする | 204 |

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

## Discord 通知

送り先は、運営が環境変数 `DISCORD_WEBHOOK_URL` で設定する全体向けの1本と、主催者がLT会ごとに設定する `webhookUrl`（作成時か `PATCH /events/:id`）。
両方あれば両方に送る（同じ URL なら1回）。サーバーから任意の URL に POST させないよう、`webhookUrl` は
`https://discord.com/api/webhooks/...`（`discordapp.com`、`ptb.` / `canary.` を含む）の形式だけを受け付ける。

## エラー

NestJS 標準の形式。`message` は文字列か、バリデーションエラー時は文字列の配列。

```json
{ "statusCode": 400, "message": ["title must be longer than or equal to 1 characters"], "error": "Bad Request" }
```

| ステータス | 主な原因 |
| --- | --- |
| 400 | バリデーションエラー、無効・期限切れのパスワード再設定リンク、締め切り後の回答、決定済み候補日の削除、終了済みLT会の再終了・開催日決定 |
| 401 | トークンなし・無効、ログイン失敗 |
| 403 | 主催者以外による操作、運営以外による `/admin` の操作 |
| 404 | LT会・候補日・通知が存在しない |
| 409 | メールアドレス重複 |
| 429 | レート制限超過（下記） |

## レート制限

`@nestjs/throttler` で IP ごとに制限する（設定は `apps/api/src/common/throttle.ts`）。
web（BFF）は利用者の IP を `X-Forwarded-For` で渡し、api は `TRUST_PROXY` で信頼したプロキシからの値だけを `req.ip` に使う。

| 対象 | 上限 |
| --- | --- |
| 全エンドポイント（`GET /health` を除く） | 120 回 / 分 |
| `POST /auth/register` | 20 回 / 10 分 |
| `POST /auth/login` | 10 回 / 分 |
| `POST /auth/password-reset/request` | 5 回 / 10 分（1 回ごとにメールが飛ぶので特に厳しくする） |
| `POST /auth/password-reset/confirm` | 10 回 / 10 分 |
| `GET /auth/oauth/:provider/url` | 30 回 / 分 |
| `POST /auth/oauth/:provider` | 20 回 / 分 |
| `POST /events` | 10 回 / 時 |
| `PUT /events/:id/responses` | 30 回 / 分 |
| `PUT /share/:token/responses` | 30 回 / 分 |
| `POST /events/:id/comments` | 10 回 / 分 |

会場 Wi-Fi など NAT 配下では参加者全員が同じ IP になるため、その場で数十人が一斉に登録・回答しても詰まらない上限にしている。

**デプロイ時の注意**

- `TRUST_PROXY` はホップ数ではなく web サーバーの IP / CIDR で指定する。ホップ数だと接続元に関係なく `X-Forwarded-For` の末尾を信じるので、api に直接届くリクエストが値を偽装して制限を回避できる
- api は外部に公開せず、web からだけ届くようにする（CORS を開けているのは将来の直接利用に備えたもの）
- Render + Vercel の本番構成では上の2つを満たせないため、`TRUST_PROXY=2` にしている。理由と残るリスクは [deploy.md](deploy.md#trust_proxyレート制限) を参照
- `TRUST_PROXY` を設定し忘れると、全利用者が web サーバーの IP 1 つを共有し、サービス全体で上限を分け合うことになる（登録が全体で 10 分に 20 件など）

## 運営ユーザー

`users.role = 'ADMIN'` のユーザーが `/admin` を使える。シードでは `admin@example.com / password123`。
本番で付与するときは DB で直接更新する: `UPDATE users SET role = 'ADMIN' WHERE email = '...';`
操作は `moderation_logs` に残る。

## 回答者の識別

`EventDetailDto.responders[].responderKey` は、ログインユーザーなら `user.id`、ゲストなら `guest:<guestKey の SHA-256（16進）>`。
guestKey は知っていれば回答の上書きや配信URL の取得ができる合言葉なので、公開する一覧にはハッシュだけを載せる。
web 側はこれで「自分の行」を見つけて強調表示・初期値の復元をしている。

## ハンドル

`users.handle` はプロフィールの URL（`/users/:handle`）と `@` 参照に使う一意の ID。

- 形式は `^[a-z0-9_]{3,20}$`（`HANDLE_PATTERN`）。API は前後の空白を除き小文字にしてから検証・保存する
- `me` / `admin` などルーティングや運営と紛らわしいものは予約語（`RESERVED_HANDLES`）で使えない。`GET /users/me` と重ならないよう、`ProfilesModule` は `UsersModule` より後に読み込む
- 導入前からいたユーザーには、マイグレーションで `test_user_` + id の先頭 10 文字の仮ハンドルを付けた（開発・テスト用のデータ。本人が /me で変更する）
- アバター（`avatarUrl`）が未設定なら、web はハンドルから DiceBear で生成した画像を出す
