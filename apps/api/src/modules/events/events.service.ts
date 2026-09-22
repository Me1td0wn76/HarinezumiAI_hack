import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { EventDetailDto, EventSummaryDto, PageDto, TagCountDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EventsRepository, type EventDetail, type NewCandidateDate } from './events.repository.js';
import { toEventDetailDto, toEventSummaryDto } from './events.mapper.js';
import { normalizeTags } from './tags.js';
import { ListEventsQueryDto } from './dto/list-events-query.dto.js';
import { CandidateDateDto } from './dto/candidate-date.dto.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { AddDatesDto } from './dto/add-dates.dto.js';
import { ConfirmEventDto } from './dto/confirm-event.dto.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly events: EventsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: ListEventsQueryDto): Promise<PageDto<EventSummaryDto>> {
    const page = await this.events.findPage(
      {
        tag: query.tag?.trim().toLowerCase() || undefined,
        q: query.q?.trim() || undefined,
        status: query.status,
        organizerId: query.organizerId,
      },
      query.limit,
      query.cursor,
    );
    return { items: page.items.map(toEventSummaryDto), nextCursor: page.nextCursor };
  }

  topTags(limit: number): Promise<TagCountDto[]> {
    return this.events.findTopTags(limit);
  }

  async create(organizer: User, dto: CreateEventDto): Promise<EventDetailDto> {
    const event = await this.events.create({
      title: dto.title,
      description: dto.description,
      organizerId: organizer.id,
      candidateDates: parseCandidateDates(dto.candidateDates),
      tags: normalizeTags(dto.tags),
    });
    this.notifications.eventCreated(event);
    return toEventDetailDto(event, organizer.id);
  }

  async getDetail(id: string, viewer: User | null): Promise<EventDetailDto> {
    const event = await this.findOrThrow(id);
    return toEventDetailDto(event, viewer?.id ?? null);
  }

  async update(id: string, user: User, dto: UpdateEventDto): Promise<EventDetailDto> {
    await this.findOwnedOrThrow(id, user);
    const updated = await this.events.update(
      id,
      { title: dto.title, description: dto.description },
      dto.tags !== undefined ? normalizeTags(dto.tags) : undefined,
    );
    return toEventDetailDto(updated, user.id);
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOwnedOrThrow(id, user);
    await this.events.delete(id);
  }

  async addDates(id: string, user: User, dto: AddDatesDto): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (event.status !== 'OPEN') {
      throw new BadRequestException('日程調整中のLT会にのみ候補日を追加できます');
    }
    await this.events.addDates(id, parseCandidateDates(dto.candidateDates));
    return this.getDetail(id, user);
  }

  async removeDate(id: string, dateId: string, user: User): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (!event.candidateDates.some((d) => d.id === dateId)) {
      throw new NotFoundException('候補日が見つかりません');
    }
    if (event.confirmedDateId === dateId) {
      throw new BadRequestException('決定済みの開催日は削除できません');
    }
    await this.events.deleteDate(dateId);
    return this.getDetail(id, user);
  }

  /** 主催者が開催日を決定する */
  async confirm(id: string, user: User, dto: ConfirmEventDto): Promise<EventDetailDto> {
    const event = await this.findOwnedOrThrow(id, user);
    if (!event.candidateDates.some((d) => d.id === dto.eventDateId)) {
      throw new NotFoundException('候補日が見つかりません');
    }
    const confirmed = await this.events.confirm(id, dto.eventDateId);
    this.notifications.eventConfirmed(confirmed);
    return toEventDetailDto(confirmed, user.id);
  }

  async findOrThrow(id: string): Promise<EventDetail> {
    const event = await this.events.findDetailById(id);
    if (!event) throw new NotFoundException('LT会が見つかりません');
    return event;
  }

  private async findOwnedOrThrow(id: string, user: User): Promise<EventDetail> {
    const event = await this.findOrThrow(id);
    if (event.organizerId !== user.id) {
      throw new ForbiddenException('主催者のみ操作できます');
    }
    return event;
  }
}

function parseCandidateDates(dates: CandidateDateDto[]): NewCandidateDate[] {
  return dates.map((d) => {
    const startsAt = new Date(d.startsAt);
    const endsAt = d.endsAt ? new Date(d.endsAt) : null;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('終了日時は開始日時より後にしてください');
    }
    return { startsAt, endsAt };
  });
}
