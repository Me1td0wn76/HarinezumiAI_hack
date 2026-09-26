import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { EntriesService } from './entries.service.js';
import { SubmitEntryDto } from './dto/submit-entry.dto.js';

/** 自分の参加表明（登壇 / 聴講）。一覧は GET /events/:id の entries に含まれる */
@Controller('events/:id/entry')
@UseGuards(JwtAuthGuard)
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  @Put()
  @Throttle(THROTTLE.entry)
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: SubmitEntryDto) {
    return this.entries.submit(id, user, dto);
  }

  @Delete()
  @HttpCode(204)
  @Throttle(THROTTLE.entry)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.entries.remove(id, user);
  }
}
