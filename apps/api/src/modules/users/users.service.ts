import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserDto, UserProfileDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from './users.repository.js';
import { toUserDto } from './users.mapper.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  getMe(user: User): UserDto {
    return toUserDto(user);
  }

  /**
   * 他人のプロフィール画面用。ログイン中なら isFollowing も含めて1回で返す。
   * @param viewer 閲覧者。未ログインなら null
   */
  async getPublicProfile(id: string, viewer: User | null): Promise<UserProfileDto> {
    const profile = await this.users.findProfileById(id);
    if (!profile) {
      throw new NotFoundException('ユーザーが見つかりません');
    }

const isViewingSelf = viewer?.id === id;
    const isFollowing = viewer && !isViewingSelf ? await this.users.isFollowedBy(viewer.id, id) : false;

    return {
      id: profile.id,
      displayName: profile.displayName,
      bio: profile.bio,
      followerCount: profile._count.followers,
      followingCount: profile._count.following,
      isFollowing,
    };
  }

  async updateProfile(user: User, dto: UpdateProfileDto): Promise<UserDto> {
    const updated = await this.users.update(user.id, {
      displayName: dto.displayName,
      bio: dto.bio,
    });
    return toUserDto(updated);
  }
}
