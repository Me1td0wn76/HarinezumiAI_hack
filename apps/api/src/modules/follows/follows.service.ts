import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PublicUserDto } from '@lt/shared';
import { UsersRepository } from '../users/users.repository.js';
import { toPublicUserDto } from '../users/users.mapper.js';
import { FollowsRepository } from './follows.repository.js';

@Injectable()
export class FollowsService {
  constructor(
    private readonly follows: FollowsRepository,
    private readonly users: UsersRepository,
  ) {}

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('自分自身はフォローできません');
    }

    const target = await this.users.findById(followingId);

    if (!target) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

    await this.follows.upsertFollow(followerId, followingId);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.follows.deleteFollow(followerId, followingId);
  }

  async listFollowers(userId: string): Promise<PublicUserDto[]> {
    const users = await this.follows.findFollowers(userId);
    return users.map(toPublicUserDto);
  }

  async listFollowing(userId: string): Promise<PublicUserDto[]> {
    const users = await this.follows.findFollowing(userId);
    return users.map(toPublicUserDto);
  }
}
