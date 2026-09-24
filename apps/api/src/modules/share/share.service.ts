import { Injectable, NotFoundException } from '@nestjs/common';
import type { EventDetailDto } from '@lt/shared';
import { EventsRepository, type EventDetail } from '../events/events.repository.js';
import { toEventDetailDto } from '../events/events.mapper.js';
import { ResponsesService } from '../responses/responses.service.js';
import { SubmitGuestResponsesDto } from '../responses/dto/submit-guest-responses.dto.js';

/** 共有URL（ログイン不要）経由のアクセス */
@Injectable()
export class ShareService {
  constructor(
    private readonly events: EventsRepository,
    private readonly responses: ResponsesService,
  ) {}

  /** @param guestKey 渡されると、そのゲストが回答済みかを見て配信URL の出し分けをする */
  async getByToken(token: string, guestKey?: string): Promise<EventDetailDto> {
    const event = await this.findOrThrow(token);
    return toEventDetailDto(event, { guestKey });
  }

  async respond(token: string, dto: SubmitGuestResponsesDto): Promise<EventDetailDto> {
    const event = await this.findOrThrow(token);
    return this.responses.submitForGuest(event, dto);
  }

  private async findOrThrow(token: string): Promise<EventDetail> {
    const event = await this.events.findDetailByShareToken(token);
    if (!event) throw new NotFoundException('LT会が見つかりません');
    return event;
  }
}
