import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ReportsService } from './reports.service.js';
import { ReportDto } from './dto/report.dto.js';

/** 通報はログインユーザーのみ（匿名だと件数の水増しに使われるため） */
@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('events/:id/report')
  @HttpCode(204)
  reportEvent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: ReportDto) {
    return this.reports.reportEvent(user, id, dto);
  }

  @Post('users/:id/report')
  @HttpCode(204)
  reportUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: ReportDto) {
    return this.reports.reportUser(user, id, dto);
  }
}
