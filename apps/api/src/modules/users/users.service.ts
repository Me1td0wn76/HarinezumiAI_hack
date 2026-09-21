import { Injectable } from '@nestjs/common';
import type { UserDto } from '@lt/shared';
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

  async updateProfile(user: User, dto: UpdateProfileDto): Promise<UserDto> {
    const updated = await this.users.update(user.id, {
      displayName: dto.displayName,
      bio: dto.bio,
    });
    return toUserDto(updated);
  }
}
