import { Body, Controller, Get, Param, Put } from '@nestjs/common';
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
  respond(@Param('token') token: string, @Body() dto: SubmitGuestResponsesDto) {
    return this.share.respond(token, dto);
  }
}
