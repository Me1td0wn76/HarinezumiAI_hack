import type { PublicUserDto, UserDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import type { PublicUser } from './users.repository.js';

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toPublicUserDto(user: PublicUser): PublicUserDto {
  return { id: user.id, handle: user.handle, displayName: user.displayName, avatarUrl: user.avatarUrl };
}
