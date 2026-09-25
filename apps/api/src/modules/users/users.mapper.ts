import type { PublicUserDto, UserDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toPublicUserDto(
  user: Pick<User, 'id' | 'displayName'>,
): PublicUserDto {
  return { id: user.id, displayName: user.displayName };
}
