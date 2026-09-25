import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { publicUserSelect, type PublicUser } from '../users/users.repository.js';

@Injectable()
export class BlocksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBlockedIds(blockerId: string): Promise<string[]> {
    const rows = await this.prisma.block.findMany({ where: { blockerId }, select: { blockedId: true } });
    return rows.map((r) => r.blockedId);
  }

  /** ブロックした相手。新しい順 */
  async findBlockedUsers(blockerId: string): Promise<PublicUser[]> {
    const rows = await this.prisma.block.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      select: { blocked: { select: publicUserSelect } },
    });
    return rows.map((r) => r.blocked);
  }

  /** 既にブロック済みなら何もしない */
  async block(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }
}
