import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { BlocksService } from './blocks.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  /** 自分がブロックしているユーザー */
  @Get('me/blocks')
  list(@CurrentUser() user: User) {
    return this.blocks.list(user);
  }

  @Post(':id/block')
  @HttpCode(204)
  block(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.blocks.block(user, id);
  }

  @Delete(':id/block')
  @HttpCode(204)
  unblock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.blocks.unblock(user, id);
  }
}
