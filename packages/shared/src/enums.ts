/**
 * API で使う列挙値。apps/api の prisma/schema.prisma の enum と一致させること。
 */

/** 候補日への回答: ○ / △ / × */
export const AVAILABILITY = ['YES', 'MAYBE', 'NO'] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  YES: '○',
  MAYBE: '△',
  NO: '×',
};

/** LT会の状態 */
export const EVENT_STATUS = ['OPEN', 'CONFIRMED', 'CLOSED'] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  OPEN: '日程調整中',
  CONFIRMED: '開催日決定',
  CLOSED: '終了',
};

/** ユーザーの権限 */
export const USER_ROLE = ['USER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLE)[number];

/** 通報の対象 */
export const REPORT_TARGET_TYPE = ['EVENT', 'USER'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPE)[number];

/** 通報の理由 */
export const REPORT_REASON = ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER'] as const;
export type ReportReason = (typeof REPORT_REASON)[number];

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM: 'スパム・宣伝',
  HARASSMENT: '誹謗中傷・嫌がらせ',
  INAPPROPRIATE: '不適切な内容',
  OTHER: 'その他',
};

/** 開催形式 */
export const EVENT_FORMAT = ['ONLINE', 'OFFLINE', 'HYBRID'] as const;
export type EventFormat = (typeof EVENT_FORMAT)[number];

export const EVENT_FORMAT_LABEL: Record<EventFormat, string> = {
  ONLINE: 'オンライン',
  OFFLINE: 'オフライン',
  HYBRID: 'ハイブリッド',
};

/** アプリ内通知の種類 */
export const NOTIFICATION_TYPE = ['EVENT_CREATED', 'EVENT_CONFIRMED'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

/** 団体での役割。OWNER は団体の編集・メンバーの追加と削除ができる */
export const ORGANIZATION_ROLE = ['OWNER', 'MEMBER'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLE)[number];

export const ORGANIZATION_ROLE_LABEL: Record<OrganizationRole, string> = {
  OWNER: 'オーナー',
  MEMBER: 'メンバー',
};
