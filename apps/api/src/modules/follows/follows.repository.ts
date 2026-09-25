import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Follow } from '../../generated/prisma/client.js';
import { publicUserSelect, type PublicUser } from '../users/users.repository.js';

/** フォロワー・フォロー中の一覧で返す最大件数（新しい順） */
const LIST_LIMIT = 50;

@Injectable()
export class FollowsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** フォローする */
  upsertFollow(followerId: string, followingId: string): Promise<Follow> {
    return this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  /** フォロー解除 */
  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  /** followerId が followingId をフォロー中か */
  async exists(followerId: string, followingId: string): Promise<boolean> {
    const found = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
      select: { id: true },
    });
    return found !== null;
  }

  /** userId のフォロワー数・フォロー中の数 */
  async countFor(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }

  /** userId をフォローしている人たち */
  async findFollowers(userId: string): Promise<PublicUser[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { follower: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
    });
    return rows.map((r) => r.follower);
  }

  /** userId がフォローしている人たち */
  async findFollowing(userId: string): Promise<PublicUser[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { following: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
    });
    return rows.map((r) => r.following);
  }
}
