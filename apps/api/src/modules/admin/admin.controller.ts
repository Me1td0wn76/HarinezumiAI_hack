import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { AdminService } from './admin.service.js';
import { ModerateEventDto } from './dto/moderate-event.dto.js';

/** 運営向けの操作。role = ADMIN のユーザーのみ */
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('reports')
  reports() {
    return this.admin.listReports();
  }

  @Post('events/:id/hide')
  @HttpCode(204)
  hide(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: ModerateEventDto) {
    return this.admin.setEventHidden(user, id, true, dto);
  }

  @Post('events/:id/unhide')
  @HttpCode(204)
  unhide(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: ModerateEventDto) {
    return this.admin.setEventHidden(user, id, false, dto);
  }
}
