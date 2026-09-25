import { Injectable, NotFoundException } from '@nestjs/common';
import { HANDLE_PATTERN, type UserProfileDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users/users.repository.js';
import { toPublicUserDto } from '../users/users.mapper.js';
import { EventsRepository } from '../events/events.repository.js';
import { toEventSummaryDto } from '../events/events.mapper.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { FollowsRepository } from '../follows/follows.repository.js';

/** 公開プロフィール。メールアドレスなど本人以外に見せない情報は返さない */
@Injectable()
export class ProfilesService {
  constructor(
    private readonly users: UsersRepository,
    private readonly events: EventsRepository,
    private readonly blocks: BlocksRepository,
    private readonly follows: FollowsRepository,
  ) {}

  /** @param viewer ログインしていれば、ブロックしている相手が主催したLT会を除き、フォロー中かも返す */
  async getByHandle(rawHandle: string, viewer: User | null): Promise<UserProfileDto> {
    const handle = rawHandle.toLowerCase();
    // 形式に合わないハンドルは存在し得ないので DB に問い合わせない
    const user = HANDLE_PATTERN.test(handle) ? await this.users.findByHandle(handle) : null;
    if (!user) throw new NotFoundException('ユーザーが見つかりません');

    const blockedIds = viewer ? await this.blocks.findBlockedIds(viewer.id) : [];
    const [organized, upcoming, followCounts, isFollowing] = await Promise.all([
      this.events.findPublicByOrganizer(user.id, blockedIds),
      this.events.findUpcomingRespondedBy(user.id, new Date(), blockedIds),
      this.follows.countFor(user.id),
      viewer && viewer.id !== user.id ? this.follows.exists(viewer.id, user.id) : false,
    ]);
    return {
      user: { ...toPublicUserDto(user), bio: user.bio, createdAt: user.createdAt.toISOString() },
      organized: organized.map(toEventSummaryDto),
      upcoming: upcoming.map(toEventSummaryDto),
      followerCount: followCounts.followers,
      followingCount: followCounts.following,
      isFollowing,
    };
  }
}
