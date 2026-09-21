import { Body, Controller, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ResponsesService } from './responses.service.js';
import { SubmitResponsesDto } from './dto/submit-responses.dto.js';

@Controller('events/:id/responses')
@UseGuards(JwtAuthGuard)
export class ResponsesController {
  constructor(private readonly responses: ResponsesService) {}

  /** 自分の回答をまとめて登録・更新する */
  @Put()
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: SubmitResponsesDto) {
    return this.responses.submitForUser(id, user, dto);
  }
}
