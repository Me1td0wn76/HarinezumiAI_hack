import { BadRequestException, Injectable } from '@nestjs/common';
import type { EventDetailDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import type { EventDetail } from '../events/events.repository.js';
import { EventsService } from '../events/events.service.js';
import { toEventDetailDto } from '../events/events.mapper.js';
import { ResponsesRepository, type ResponseValue } from './responses.repository.js';
import { ResponseInputDto } from './dto/response-input.dto.js';
import { SubmitResponsesDto } from './dto/submit-responses.dto.js';
import { SubmitGuestResponsesDto } from './dto/submit-guest-responses.dto.js';

@Injectable()
export class ResponsesService {
  constructor(
    private readonly responses: ResponsesRepository,
    private readonly events: EventsService,
  ) {}

  /** ログインユーザーが候補日に回答する */
  async submitForUser(eventId: string, user: User, dto: SubmitResponsesDto): Promise<EventDetailDto> {
    const event = await this.events.findOrThrow(eventId);
    const values = this.validate(event, dto.responses);
    await this.responses.upsertForUser(user.id, values);
    return this.events.getDetail(eventId, user);
  }

  /** 共有URL から来たゲストが候補日に回答する */
  async submitForGuest(event: EventDetail, dto: SubmitGuestResponsesDto): Promise<EventDetailDto> {
    const values = this.validate(event, dto.responses);
    await this.responses.upsertForGuest(dto.guestKey, dto.guestName.trim(), values);
    const updated = await this.events.findOrThrow(event.id);
    return toEventDetailDto(updated, { guestKey: dto.guestKey });
  }

  /** 回答先が本当にこのLT会の候補日か、まだ回答を受け付けているかを確認する */
  private validate(event: EventDetail, inputs: ResponseInputDto[]): ResponseValue[] {
    if (event.status !== 'OPEN') {
      throw new BadRequestException('このLT会は回答を締め切っています');
    }
    const dateIds = new Set(event.candidateDates.map((d) => d.id));
    const seen = new Set<string>();
    return inputs.map((r) => {
      if (!dateIds.has(r.eventDateId)) {
        throw new BadRequestException(`候補日 ${r.eventDateId} はこのLT会のものではありません`);
      }
      if (seen.has(r.eventDateId)) {
        throw new BadRequestException('同じ候補日への回答が重複しています');
      }
      seen.add(r.eventDateId);
      return { eventDateId: r.eventDateId, availability: r.availability, comment: r.comment ?? null };
    });
  }
}
