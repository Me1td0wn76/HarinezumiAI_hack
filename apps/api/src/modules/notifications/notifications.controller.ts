import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { InboxService } from './inbox.service.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly inbox: InboxService) {}

  /** 自分宛ての通知（新しい順、1ページ分） */
  @Get()
  list(@CurrentUser() user: User, @Query() query: ListNotificationsQueryDto) {
    return this.inbox.list(user, query.cursor);
  }

  /** ヘッダーのバッジ用 */
  @Get('unread-count')
  unreadCount(@CurrentUser() user: User) {
    return this.inbox.unreadCount(user);
  }

  @Post('read-all')
  @HttpCode(204)
  markAllRead(@CurrentUser() user: User) {
    return this.inbox.markAllRead(user);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.inbox.markRead(id, user);
  }
}
