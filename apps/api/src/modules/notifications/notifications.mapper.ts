import type { NotificationDto } from '@lt/shared';
import type { Notification } from '../../generated/prisma/client.js';

export function toNotificationDto(n: Notification): NotificationDto {
  // data は type ごとの形で保存している（NotificationsRepository の NewNotification）。DB の Json 型からはそれを読み取れないため型を当てる
  return {
    id: n.id,
    type: n.type,
    eventId: n.eventId,
    data: n.data,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  } as NotificationDto;
}
