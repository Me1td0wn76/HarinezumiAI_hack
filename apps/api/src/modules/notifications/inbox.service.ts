import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationDto, PageDto, UnreadCountDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import {
  NotificationsRepository,
  decodeNotificationCursor,
  encodeNotificationCursor,
} from './notifications.repository.js';
import { toNotificationDto } from './notifications.mapper.js';

/** 1ページに返す件数。一度に大量に返して画面が重くならないよう区切る */
export const PAGE_SIZE = 30;

/**
 * ログインユーザー自身のアプリ内通知（受信箱）を読む・既読にする。
 * 通知を「作る」側は NotificationsService が担う。
 */
@Injectable()
export class InboxService {
  constructor(private readonly notifications: NotificationsRepository) {}

  /** 新しい順に1ページ分。cursor は前ページの nextCursor */
  async list(user: User, rawCursor?: string): Promise<PageDto<NotificationDto>> {
    const cursor = rawCursor ? decodeNotificationCursor(rawCursor) : undefined;
    if (cursor === null) throw new BadRequestException('cursor が不正です');
    // 1件多く取り、続きがあるかを判定する
    const rows = await this.notifications.findPageByUser(user.id, PAGE_SIZE + 1, cursor);
    const items = rows.slice(0, PAGE_SIZE);
    const last = items[items.length - 1];
    return {
      items: items.map(toNotificationDto),
      nextCursor: rows.length > PAGE_SIZE ? encodeNotificationCursor(last) : null,
    };
  }

  async unreadCount(user: User): Promise<UnreadCountDto> {
    return { count: await this.notifications.countUnread(user.id) };
  }

  /** 既読にする。既に既読なら何もしない。他人の通知は存在しない扱い */
  async markRead(id: string, user: User): Promise<NotificationDto> {
    await this.notifications.markRead(id, user.id);
    const n = await this.notifications.findOwned(id, user.id);
    if (!n) throw new NotFoundException('通知が見つかりません');
    return toNotificationDto(n);
  }

  async markAllRead(user: User): Promise<void> {
    await this.notifications.markAllRead(user.id);
  }
}
