import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Event, User } from '../../generated/prisma/client.js';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEvents(ids: string[]): Promise<Pick<Event, 'id' | 'title' | 'hiddenAt'>[]> {
    return this.prisma.event.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, hiddenAt: true },
    });
  }

  findUsers(ids: string[]): Promise<Pick<User, 'id' | 'displayName'>[]> {
    return this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true } });
  }

  /** LT会の表示状態を変え、同じトランザクションで操作ログを残す */
  async setEventHidden(input: {
    adminId: string;
    eventId: string;
    hidden: boolean;
    note: string | null;
  }): Promise<void> {
    const { adminId, eventId, hidden, note } = input;
    await this.prisma.$transaction([
      this.prisma.event.update({ where: { id: eventId }, data: { hiddenAt: hidden ? new Date() : null } }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          action: hidden ? 'HIDE_EVENT' : 'UNHIDE_EVENT',
          targetType: 'EVENT',
          targetId: eventId,
          note,
        },
      }),
    ]);
  }
}
