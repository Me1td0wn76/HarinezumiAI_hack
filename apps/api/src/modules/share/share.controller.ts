import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { ShareService } from './share.service.js';
import { SubmitGuestResponsesDto } from '../responses/dto/submit-guest-responses.dto.js';

@Controller('share')
export class ShareController {
  constructor(private readonly share: ShareService) {}

  /** `?guestKey=` を付けると、そのゲストが回答済みなら開催日決定後に配信URL が含まれる */
  @Get(':token')
  get(@Param('token') token: string, @Query('guestKey') guestKey?: string) {
    return this.share.getByToken(token, guestKey?.slice(0, 64) || undefined);
  }

  @Put(':token/responses')
  @Throttle(THROTTLE.guestResponses)
  respond(@Param('token') token: string, @Body() dto: SubmitGuestResponsesDto) {
    return this.share.respond(token, dto);
  }
}
