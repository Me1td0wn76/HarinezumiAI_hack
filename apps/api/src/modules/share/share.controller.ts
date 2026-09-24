import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { ShareService } from './share.service.js';
import { SubmitGuestResponsesDto } from '../responses/dto/submit-guest-responses.dto.js';

@Controller('share')
export class ShareController {
  constructor(private readonly share: ShareService) {}

  @Get(':token')
  get(@Param('token') token: string) {
    return this.share.getByToken(token);
  }

  @Put(':token/responses')
  @Throttle(THROTTLE.guestResponses)
  respond(@Param('token') token: string, @Body() dto: SubmitGuestResponsesDto) {
    return this.share.respond(token, dto);
  }
}
