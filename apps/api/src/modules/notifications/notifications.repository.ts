import { Injectable } from '@nestjs/common';
import type { NotificationDataMap, NotificationType } from '@lt/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Notification, Prisma } from '../../generated/prisma/client.js';

/**
 * 1回の INSERT で作る通知の最大件数。
 * PostgreSQL の1クエリあたりのパラメータ上限（65535）を超えないよう、また宛先 ID を一度に読み込みすぎないよう区切る
 */
const BATCH_SIZE = 1000;

/**
 * 既読にしてからこの日数がたった通知は削除する（NotificationsCleanupService）。
 * 新しいLT会の通知は全ユーザーに届くため、行が増え続けないよう保持期間を決めている
 */
export const RETENTION_DAYS = 90;

export interface NewNotification<K extends NotificationType = NotificationType> {
  type: K;
  eventId: string;
  data: NotificationDataMap[K];
}

/** 一覧の続きの位置。前ページ最後の通知の並び順キー */
export interface NotificationCursor {
  createdAt: Date;
  id: string;
}

/** クライアントに中身を意識させないよう、base64url の不透明な文字列にする（GET /events と同じ形式） */
export function encodeNotificationCursor(n: NotificationCursor): string {
  return Buffer.from(`${n.createdAt.toISOString()}|${n.id}`).toString('base64url');
}

/** 壊れた cursor は null */
export function decodeNotificationCursor(raw: string): NotificationCursor | null {
  const [iso, id, ...rest] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
  const createdAt = new Date(iso);
  if (rest.length > 0 || !id || Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
}

/**
 * 主催者に届けてよい相手の条件: 主催者本人ではなく、主催者をブロックしていない。
 * 新規作成・開催日決定の両方でこれを使い、ブロックの扱いを揃える（向きは「受け取る側 → 主催者」）
 */
function audienceOf(organizerId: string): Prisma.UserWhereInput {
  return {
    id: { not: organizerId },
    blocking: { none: { blockedId: organizerId } },
  };
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 新しいLT会の通知を全ユーザーに作る（主催者本人と、主催者をブロックしている人は除く）。
   * 人数が増えてもメモリを食わないよう ID 順に区切って処理する
   */
  async createForEventAudience(organizerId: string, n: NewNotification): Promise<void> {
    let after: string | undefined;
    for (;;) {
      const users = await this.prisma.user.findMany({
        where: {
          AND: [audienceOf(organizerId), ...(after ? [{ id: { gt: after } }] : [])],
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
      });
      if (users.length === 0) return;
      await this.insert(
        users.map((u) => u.id),
        n,
      );
      if (users.length < BATCH_SIZE) return;
      after = users[users.length - 1].id;
    }
  }

  /** 開催日決定の通知を、指定した回答者に作る（主催者本人と、主催者をブロックしている人は除く） */
  async createForRespondents(userIds: string[], organizerId: string, n: NewNotification): Promise<void> {
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const users = await this.prisma.user.findMany({
        where: { AND: [audienceOf(organizerId), { id: { in: userIds.slice(i, i + BATCH_SIZE) } }] },
        select: { id: true },
      });
      await this.insert(
        users.map((u) => u.id),
        n,
      );
    }
  }

  private async insert(userIds: string[], n: NewNotification): Promise<void> {
    if (userIds.length === 0) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type: n.type, eventId: n.eventId, data: { ...n.data } })),
    });
  }

  /** 新しい順に最大 take 件。createdAt が同じ通知は id で順序を決める */
  findPageByUser(userId: string, take: number, cursor?: NotificationCursor): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(cursor && {
          OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
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

  /** 本人の未読の通知だけを既読にする。他人の通知・既読済みなら何もしない */
  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * 既読にした日時が before より前の通知を削除し、削除した件数を返す。
   * 一度に大量の行を消してテーブルを長くロックしないよう、BATCH_SIZE 件ずつ消す
   */
  async deleteReadBefore(before: Date): Promise<number> {
    let total = 0;
    for (;;) {
      const rows = await this.prisma.notification.findMany({
        where: { readAt: { lt: before } },
        select: { id: true },
        take: BATCH_SIZE,
      });
      if (rows.length === 0) return total;
      const { count } = await this.prisma.notification.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
      total += count;
      if (rows.length < BATCH_SIZE) return total;
    }
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
