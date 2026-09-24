import type { Availability, EventFormat, EventStatus } from './enums.js';

// ---------- 認証 ----------

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
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

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string | null;
}

/** 他人に見せる最小限のユーザー情報 */
export interface PublicUserDto {
  id: string;
  displayName: string;
}

// ---------- LT会 ----------

export interface CreateEventRequest {
  title: string;
  description: string;
  /** ISO 8601 の日時文字列 */
  candidateDates: CandidateDateInput[];
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

/** GET /events のクエリ。空の値は「絞り込みなし」 */
export interface EventListQuery {
  /** 前ページの nextCursor をそのまま渡す */
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
