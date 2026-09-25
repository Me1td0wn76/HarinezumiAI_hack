import type {
  Availability,
  EventFormat,
  EventStatus,
  NotificationType,
  ReportReason,
  ReportTargetType,
  UserRole,
} from './enums.js';

// ---------- 認証 ----------

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  /** プロフィールURL に使う ID。HANDLE_PATTERN に合うこと（大文字は API 側で小文字にする） */
  handle: string;
  /** 利用規約・プライバシーポリシーへの同意。true でないと登録できない */
  agreeToTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

// ---------- ユーザー ----------

/** ハンドルの形式（3〜20文字の英小文字・数字・_）。API とフォームの両方で使う */
export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;
export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;

/** ルーティングや運営と紛らわしいため使えないハンドル（/users/me など） */
export const RESERVED_HANDLES: readonly string[] = [
  'me',
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'official',
  'settings',
  'new',
  'edit',
  'login',
  'logout',
  'register',
  'api',
  'null',
  'undefined',
];

export interface UserDto {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string | null;
  handle?: string;
  /** https の画像URL。null / 空文字で解除する */
  avatarUrl?: string | null;
}

/** 他人に見せる最小限のユーザー情報。メールアドレスは含めない */
export interface PublicUserDto {
  id: string;
  handle: string;
  displayName: string;
  /** NULL なら web 側でハンドルから生成した画像を出す */
  avatarUrl: string | null;
}

/** 公開プロフィール（GET /users/:handle） */
export interface UserProfileDto {
  user: PublicUserDto & { bio: string | null; createdAt: string };
  /** 主催したLT会（非表示を除く。新しい順） */
  organized: EventSummaryDto[];
  /** 参加予定: 候補日に回答したLT会のうち、日程調整中か開催日がまだ来ていないもの（主催分・非表示を除く） */
  upcoming: EventSummaryDto[];
}

// ---------- LT会 ----------

export interface CreateEventRequest {
  title: string;
  description: string;
  /** ISO 8601 の日時文字列 */
  candidateDates: CandidateDateInput[];
  /** 通知先の Discord Webhook URL（任意） */
  webhookUrl?: string | null;
  /** 最大 TAG_MAX_PER_EVENT 個。先頭の # や前後の空白は API 側で正規化する */
  tags?: string[];
  /** 省略時は ONLINE */
  format?: EventFormat;
  /** 会場名・住所。OFFLINE / HYBRID のとき */
  venue?: string | null;
  /** 配信URL。ONLINE / HYBRID のとき。開催日決定後に回答者へ公開される */
  meetingUrl?: string | null;
}

export interface CandidateDateInput {
  startsAt: string;
  endsAt?: string | null;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  /** null で通知先を解除する */
  webhookUrl?: string | null;
  /** 指定した場合はタグを丸ごと置き換える */
  tags?: string[];
  format?: EventFormat;
  venue?: string | null;
  meetingUrl?: string | null;
}

export interface EventDateDto {
  id: string;
  startsAt: string;
  endsAt: string | null;
}

/** 一覧表示用 */
export interface EventSummaryDto {
  id: string;
  title: string;
  status: EventStatus;
  organizer: PublicUserDto;
  confirmedDate: EventDateDto | null;
  candidateDateCount: number;
  responderCount: number;
  tags: string[];
  format: EventFormat;
  createdAt: string;
}

// ---------- 一覧・発見 ----------

/** 1回のリクエストで返す件数の既定値と上限 */
export const EVENT_PAGE_SIZE = 20;
export const EVENT_PAGE_SIZE_MAX = 50;

/** タグの制約。API とフォームの両方で使う */
export const TAG_MAX_PER_EVENT = 5;
export const TAG_MAX_LENGTH = 20;

/** 一覧の検索語（q）の最大文字数 */
export const EVENT_SEARCH_MAX_LENGTH = 100;

/** GET /events のクエリ。空の値は「絞り込みなし」 */
export interface EventListQuery {
  /** 前ページの nextCursor をそのまま渡す（不透明な文字列） */
  cursor?: string;
  limit?: number;
  tag?: string;
  /** タイトル・説明の部分一致検索 */
  q?: string;
  status?: EventStatus;
  format?: EventFormat;
  /** 主催者で絞り込む（ユーザーページやフォロー中フィードの土台） */
  organizerId?: string;
}

/** カーソルページネーションの共通レスポンス */
export interface PageDto<T> {
  items: T[];
  /** 続きがあれば次のリクエストの cursor に渡す。無ければ null */
  nextCursor: string | null;
}

/** 使われているタグと件数（人気順） */
export interface TagCountDto {
  tag: string;
  count: number;
}

/** 候補日ごとの集計 */
export interface DateTallyDto {
  eventDate: EventDateDto;
  yes: number;
  maybe: number;
  no: number;
}

/** 回答者1人分（グリッド表の1行） */
export interface ResponderRowDto {
  /** ログインユーザーなら user.id、ゲストなら "guest:<guestKey の SHA-256（16進）>"。guestKey そのものは公開しない */
  responderKey: string;
  displayName: string;
  isGuest: boolean;
  /** eventDateId -> 回答。未回答の候補日はキーが存在しない */
  answers: Record<string, { availability: Availability; comment: string | null }>;
}

/** 詳細表示用 */
export interface EventDetailDto {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  organizer: PublicUserDto;
  confirmedDate: EventDateDto | null;
  candidateDates: EventDateDto[];
  tallies: DateTallyDto[];
  responders: ResponderRowDto[];
  /** 主催者にのみ返す。共有URL の組み立てに使う */
  shareToken: string | null;
  /** 運営が非表示にしたか。非表示のLT会は主催者と運営にしか返らない */
  hidden: boolean;
  /** 主催者にのみ返す。LT会ごとの Discord 通知先 */
  webhookUrl: string | null;
  tags: string[];
  format: EventFormat;
  venue: string | null;
  /**
   * 配信URL。主催者にはいつでも、回答者には開催日決定後にのみ返す。それ以外は null。
   * 設定されているが閲覧者に見せられない場合は hasMeetingUrl が true になる
   */
  meetingUrl: string | null;
  hasMeetingUrl: boolean;
  createdAt: string;
}

// ---------- 回答 ----------

export interface ResponseInput {
  eventDateId: string;
  availability: Availability;
  comment?: string | null;
}

/** ログインユーザーの回答（一括で上書き） */
export interface SubmitResponsesRequest {
  responses: ResponseInput[];
}

/** 共有URL からのゲスト回答 */
export interface SubmitGuestResponsesRequest {
  /** ブラウザ側で生成して保持する識別子。同じキーなら回答を更新できる */
  guestKey: string;
  guestName: string;
  responses: ResponseInput[];
}

export interface ConfirmEventRequest {
  eventDateId: string;
}

// ---------- ソーシャルログイン ----------

/** 使えるソーシャルログイン（api 側でクライアント ID が設定されているもの） */
export interface OAuthProvidersDto {
  google: boolean;
}

export interface OAuthAuthorizeUrlDto {
  url: string;
}

/** web のコールバックが受け取った認可コードを api に渡す */
export interface OAuthLoginRequest {
  code: string;
  /** PKCE の code_verifier */
  codeVerifier: string;
}

// ---------- パスワード再設定 ----------

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ConfirmPasswordResetRequest {
  /** メールのリンクに含まれるトークン */
  token: string;
  /** 新しいパスワード（8文字以上） */
  password: string;
}

// ---------- 通報・ブロック・運営 ----------

/** LT会・ユーザーの通報。同じ対象への再通報は理由の更新になる */
export interface ReportRequest {
  reason: ReportReason;
  detail?: string | null;
}

/** 運営画面: 対象ごとにまとめた通報 */
export interface AdminReportDto {
  targetType: ReportTargetType;
  targetId: string;
  /** LT会ならタイトル、ユーザーなら表示名。対象が削除済みなら null */
  label: string | null;
  /** LT会の場合の非表示状態。ユーザーなら null */
  hidden: boolean | null;
  reportCount: number;
  reasonCounts: Partial<Record<ReportReason, number>>;
  /** 新しい順の通報（補足つき）。最大 5 件 */
  recent: { reason: ReportReason; detail: string | null; createdAt: string }[];
  lastReportedAt: string;
}

export interface ModerateEventRequest {
  /** 操作の理由。ログに残す */
  note?: string | null;
}

// ---------- 履歴 ----------

/** 自分の主催・参加履歴（新しい順） */
export interface MyEventsDto {
  organized: EventSummaryDto[];
  /** 候補日に1つ以上回答したLT会（自分が主催したものは除く） */
  participated: EventSummaryDto[];
}

// ---------- コメント ----------

/** LT会へのコメント（主催者・参加者間の連絡） */
export interface EventCommentDto {
  id: string;
  body: string;
  author: PublicUserDto;
  createdAt: string;
}

export interface CreateCommentRequest {
  body: string;
}

// ---------- カレンダー ----------

/** 個人カレンダーの1件。確定したLT会は確定日1件、調整中は候補日ごとに1件 */
export interface ScheduleItemDto {
  eventId: string;
  title: string;
  status: EventStatus;
  /** 自分が主催しているか、回答者として関わっているか */
  role: 'ORGANIZER' | 'RESPONDENT';
  eventDateId: string;
  startsAt: string;
  endsAt: string | null;
  /** この日がLT会の開催日として確定しているか */
  confirmed: boolean;
  /** この候補日への自分の回答。主催者や未回答なら null */
  myAvailability: Availability | null;
}

// ---------- 通知 ----------

/** 通知の種類ごとの表示用の値。文面は web 側で組み立てる */
export interface NotificationDataMap {
  EVENT_CREATED: {
    eventTitle: string;
    organizerName: string;
    candidateDateCount: number;
  };
  EVENT_CONFIRMED: {
    eventTitle: string;
    /** 決まった開催日時（ISO 8601） */
    startsAt: string;
  };
}

interface NotificationBase {
  id: string;
  /** 対象のLT会。遷移先は /events/<eventId> */
  eventId: string | null;
  /** 既読にした日時。未読なら null */
  readAt: string | null;
  createdAt: string;
}

/** type で data の形が決まる（type で分岐すると data の型が絞り込まれる） */
export type NotificationDto = {
  [K in NotificationType]: NotificationBase & { type: K; data: NotificationDataMap[K] };
}[NotificationType];

export interface UnreadCountDto {
  count: number;
}
