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

/** 開催形式 */
export const EVENT_FORMAT = ['ONLINE', 'OFFLINE', 'HYBRID'] as const;
export type EventFormat = (typeof EVENT_FORMAT)[number];

export const EVENT_FORMAT_LABEL: Record<EventFormat, string> = {
  ONLINE: 'オンライン',
  OFFLINE: 'オフライン',
  HYBRID: 'ハイブリッド',
};
