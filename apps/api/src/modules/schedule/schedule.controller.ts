import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ScheduleService } from './schedule.service.js';

@Controller('users/me/schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  /** 自分が主催・回答したLT会の開催日 / 候補日（個人カレンダー用） */
  @Get()
  get(@CurrentUser() user: User) {
    return this.schedule.forUser(user);
  }
}
