import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma, User } from '../../generated/prisma/client.js';

/** 公開プロフィール画面に必要な最小限のフィールド + フォロワー/フォロー中の件数 */
const userProfileSelect = {
  id: true,
  displayName: true,
  bio: true,
  _count: { select: { followers: true, following: true } },
} satisfies Prisma.UserSelect;

export type UserProfile = Prisma.UserGetPayload<{
  select: typeof userProfileSelect;
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findProfileById(id: string): Promise<UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: userProfileSelect,
    });
  }

  /**
   * viewerId が targetId をフォロー中か。
   * FollowsModule を import すると循環依存になるため、Follow テーブルへは直接問い合わせる。
   */
  async isFollowedBy(viewerId: string, targetId: string): Promise<boolean> {
    const found = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: targetId },
      },
      select: { id: true },
    });
    return found !== null;
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
