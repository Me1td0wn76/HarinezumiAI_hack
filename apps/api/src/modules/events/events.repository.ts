import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EventDate, Prisma } from '../../generated/prisma/client.js';

/** 詳細画面に必要な関連をすべて含めた取得条件 */
export const eventDetailInclude = {
  organizer: { select: { id: true, displayName: true } },
  confirmedDate: true,
  candidateDates: {
    orderBy: { startsAt: 'asc' },
    include: {
      responses: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, displayName: true } } },
      },
    },
  },
} satisfies Prisma.EventInclude;

export type EventDetail = Prisma.EventGetPayload<{ include: typeof eventDetailInclude }>;

/** 一覧表示に必要な最小限の関連 */
export const eventSummaryInclude = {
  organizer: { select: { id: true, displayName: true } },
  confirmedDate: true,
  candidateDates: {
    select: { id: true, responses: { select: { userId: true, guestKey: true } } },
  },
} satisfies Prisma.EventInclude;

export type EventSummary = Prisma.EventGetPayload<{ include: typeof eventSummaryInclude }>;

export interface NewCandidateDate {
  startsAt: Date;
  endsAt: Date | null;
}

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForList(): Promise<EventSummary[]> {
    return this.prisma.event.findMany({
      include: eventSummaryInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findDetailById(id: string): Promise<EventDetail | null> {
    return this.prisma.event.findUnique({ where: { id }, include: eventDetailInclude });
  }

  findDetailByShareToken(shareToken: string): Promise<EventDetail | null> {
    return this.prisma.event.findUnique({ where: { shareToken }, include: eventDetailInclude });
  }

  create(input: {
    title: string;
    description: string;
    organizerId: string;
    candidateDates: NewCandidateDate[];
    webhookUrl: string | null;
  }): Promise<EventDetail> {
    return this.prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        webhookUrl: input.webhookUrl,
        organizer: { connect: { id: input.organizerId } },
        candidateDates: { create: input.candidateDates },
      },
      include: eventDetailInclude,
    });
  }

  update(id: string, data: Pick<Prisma.EventUpdateInput, 'title' | 'description' | 'status' | 'webhookUrl'>): Promise<EventDetail> {
    return this.prisma.event.update({ where: { id }, data, include: eventDetailInclude });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.event.delete({ where: { id } });
  }

  async addDates(eventId: string, dates: NewCandidateDate[]): Promise<void> {
    // 既に同じ開始日時がある場合は無視する（@@unique([eventId, startsAt])）
    await this.prisma.eventDate.createMany({
      data: dates.map((d) => ({ eventId, ...d })),
      skipDuplicates: true,
    });
  }

  findDate(id: string): Promise<EventDate | null> {
    return this.prisma.eventDate.findUnique({ where: { id } });
  }

  async deleteDate(id: string): Promise<void> {
    await this.prisma.eventDate.delete({ where: { id } });
  }

  confirm(eventId: string, eventDateId: string): Promise<EventDetail> {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'CONFIRMED', confirmedDate: { connect: { id: eventDateId } } },
      include: eventDetailInclude,
    });
  }
}
