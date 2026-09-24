import type { Availability, EventStatus } from './enums.js';

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
  /** 通知先の Discord Webhook URL（任意） */
  webhookUrl?: string | null;
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
  createdAt: string;
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
  /** ログインユーザーなら user.id、ゲストなら "guest:<guestKey>" */
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
  /** 主催者にのみ返す。LT会ごとの Discord 通知先 */
  webhookUrl: string | null;
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
