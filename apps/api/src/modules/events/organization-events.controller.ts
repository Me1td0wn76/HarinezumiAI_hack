import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { EventsService } from './events.service.js';
import { ListEventsQueryDto } from './dto/list-events-query.dto.js';

/**
 * 団体ごとのLT会一覧。OrganizationsModule に置くと Events → Organizations → Events の循環になるので、こちらに置く
 */
@Controller('organizations')
export class OrganizationEventsController {
  constructor(private readonly events: EventsService) {}

  /** GET /events と同じクエリ（cursor / limit / status など）が使える。存在しない団体は 404 */
  @Get(':slug/events')
  @UseGuards(OptionalJwtAuthGuard)
  list(@Param('slug') slug: string, @CurrentUser() user: User | null, @Query() query: ListEventsQueryDto) {
    return this.events.listByOrganization(slug, query, user);
  }
}
