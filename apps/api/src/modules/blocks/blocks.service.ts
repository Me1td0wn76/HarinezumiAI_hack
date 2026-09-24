import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PublicUserDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users/users.repository.js';
import { toPublicUserDto } from '../users/users.mapper.js';
import { BlocksRepository } from './blocks.repository.js';

@Injectable()
export class BlocksService {
  constructor(
    private readonly blocks: BlocksRepository,
    private readonly users: UsersRepository,
  ) {}

  async list(user: User): Promise<PublicUserDto[]> {
    const blocked = await this.blocks.findBlockedUsers(user.id);
    return blocked.map(toPublicUserDto);
  }

  async block(user: User, targetId: string): Promise<void> {
    if (targetId === user.id) throw new BadRequestException('自分自身はブロックできません');
    if (!(await this.users.findById(targetId))) throw new NotFoundException('ユーザーが見つかりません');
    await this.blocks.block(user.id, targetId);
  }

  async unblock(user: User, targetId: string): Promise<void> {
    await this.blocks.unblock(user.id, targetId);
  }
}
