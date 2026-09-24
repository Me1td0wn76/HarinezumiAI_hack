import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { EventsService } from './events.service.js';

@Controller('users/me/events')
@UseGuards(JwtAuthGuard)
export class MyEventsController {
  constructor(private readonly events: EventsService) {}

  /** 自分が主催・参加（回答）したLT会 */
  @Get()
  history(@CurrentUser() user: User) {
    return this.events.history(user);
  }
}
