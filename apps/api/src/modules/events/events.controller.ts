import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { AddDatesDto } from './dto/add-dates.dto.js';
import { ConfirmEventDto } from './dto/confirm-event.dto.js';
import { ListEventsQueryDto } from './dto/list-events-query.dto.js';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** 新着順。cursor / limit / tag / q / status / organizerId で絞り込む。ログインしていればブロックした相手のLT会を除く */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@CurrentUser() user: User | null, @Query() query: ListEventsQueryDto) {
    return this.events.list(query, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle(THROTTLE.createEvent)
  create(@CurrentUser() user: User, @Body() dto: CreateEventDto) {
    return this.events.create(user, dto);
  }

  /** 公開。主催者本人がログインして見た場合のみ shareToken が含まれる */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User | null,
  ) {
    return this.events.getDetail(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateEventDto,
  ) {
    return this.events.update(id, user, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.events.remove(id, user);
  }

  @Post(':id/dates')
  @UseGuards(JwtAuthGuard)
  addDates(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: AddDatesDto,
  ) {
    return this.events.addDates(id, user, dto);
  }

  @Delete(':id/dates/:dateId')
  @UseGuards(JwtAuthGuard)
  removeDate(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('dateId', ParseUUIDPipe) dateId: string,
    @CurrentUser() user: User,
  ) {
    return this.events.removeDate(id, dateId, user);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: ConfirmEventDto,
  ) {
    return this.events.confirm(id, user, dto);
  }
}
