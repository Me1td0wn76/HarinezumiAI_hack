import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ScheduleService } from './schedule.service.js';
import { PublicScheduleQueryDto } from './dto/public-schedule-query.dto.js';

@Controller('schedule')
export class PublicScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  /** 公開。みんなのカレンダー用に、期間内の公開中のLT会の開催日 / 候補日を返す */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: PublicScheduleQueryDto, @CurrentUser() user: User | null) {
    return this.schedule.publicBetween(query, user);
  }
}
