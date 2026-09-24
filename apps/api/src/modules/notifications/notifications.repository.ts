import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Notification, NotificationType } from '../../generated/prisma/client.js';

/**
 * 1回の INSERT で作る通知の最大件数。
 * PostgreSQL の1クエリあたりのパラメータ上限（65535）を超えないよう、また宛先 ID を一度に読み込みすぎないよう区切る
 */
const BATCH_SIZE = 1000;

export interface NewNotification {
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
}

/** ページングの位置。この通知より古いものを取る */
export interface NotificationCursor {
  id: string;
  createdAt: Date;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 同じ内容の通知を指定ユーザーに作る */
  async createForUsers(userIds: string[], data: NewNotification): Promise<void> {
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      await this.prisma.notification.createMany({
        data: userIds.slice(i, i + BATCH_SIZE).map((userId) => ({ userId, ...data })),
      });
    }
  }

  /** 同じ内容の通知を1人を除く全ユーザーに作る。ユーザー数が増えてもメモリを食わないよう ID 順に区切って処理する */
  async createForAllUsersExcept(excludeUserId: string, data: NewNotification): Promise<void> {
    let after: string | undefined;
    for (;;) {
      const users = await this.prisma.user.findMany({
        where: { id: after ? { not: excludeUserId, gt: after } : { not: excludeUserId } },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
      });
      if (users.length === 0) return;
      await this.createForUsers(
        users.map((u) => u.id),
        data,
      );
      if (users.length < BATCH_SIZE) return;
      after = users[users.length - 1].id;
    }
  }

  /** 新しい順に最大 take 件。createdAt が同じ通知は id で順序を決める */
  findPageByUser(userId: string, take: number, before?: NotificationCursor): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(before && {
          OR: [{ createdAt: { lt: before.createdAt } }, { createdAt: before.createdAt, id: { lt: before.id } }],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  findOwned(id: string, userId: string): Promise<Notification | null> {
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  markRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
