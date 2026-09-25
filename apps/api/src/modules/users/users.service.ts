import { ConflictException, Injectable } from '@nestjs/common';
import type { UserDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from './users.repository.js';
import { toUserDto } from './users.mapper.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

export function handleTaken(): ConflictException {
  return new ConflictException('このハンドルは既に使われています');
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  getMe(user: User): UserDto {
    return toUserDto(user);
  }

  async updateProfile(user: User, dto: UpdateProfileDto): Promise<UserDto> {
    if (dto.handle !== undefined && dto.handle !== user.handle && (await this.users.findByHandle(dto.handle))) {
      throw handleTaken();
    }
    const updated = await this.users.update(user.id, {
      displayName: dto.displayName,
      bio: dto.bio,
      handle: dto.handle,
      // undefined は変更なし、null は解除
      avatarUrl: dto.avatarUrl,
    });
    // 確認と更新の間に同じハンドルを取られた
    if (!updated) throw handleTaken();
    return toUserDto(updated);
  }
}
