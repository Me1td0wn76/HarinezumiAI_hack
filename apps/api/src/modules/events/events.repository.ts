import { Injectable } from '@nestjs/common';
import type { EventFormat, EventStatus, TagCountDto } from '@lt/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EventDate, Prisma } from '../../generated/prisma/client.js';
import type { FormatFields } from './format.js';

/** 詳細画面に必要な関連をすべて含めた取得条件 */
export const eventDetailInclude = {
  organizer: { select: { id: true, displayName: true } },
  confirmedDate: true,
  tags: { select: { tag: true }, orderBy: { tag: 'asc' } },
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
  tags: { select: { tag: true }, orderBy: { tag: 'asc' } },
  candidateDates: {
    select: { id: true, responses: { select: { userId: true, guestKey: true } } },
  },
} satisfies Prisma.EventInclude;

export type EventSummary = Prisma.EventGetPayload<{ include: typeof eventSummaryInclude }>;

export interface NewCandidateDate {
  startsAt: Date;
  endsAt: Date | null;
}

/** 一覧の絞り込み条件。undefined は「絞り込みなし」 */
export interface EventListFilter {
  tag?: string;
  /** タイトル・説明の部分一致（大文字小文字を区別しない） */
  q?: string;
  status?: EventStatus;
  format?: EventFormat;
  organizerId?: string;
}

export interface EventPage {
  items: EventSummary[];
  nextCursor: string | null;
}

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 新しい順のカーソルページネーション。cursor は前ページ最後の event.id。
   * limit + 1 件取って「続きがあるか」を判定する。
   */
  async findPage(filter: EventListFilter, limit: number, cursor?: string): Promise<EventPage> {
    const where: Prisma.EventWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.format) where.format = filter.format;
    if (filter.organizerId) where.organizerId = filter.organizerId;
    if (filter.tag) where.tags = { some: { tag: filter.tag } };
    if (filter.q) {
      // ILIKE '%q%'。events.title / description の pg_trgm GIN index が効く
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.event.findMany({
      where,
      include: eventSummaryInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  /** 使用回数の多いタグ */
  async findTopTags(limit: number): Promise<TagCountDto[]> {
    const rows = await this.prisma.eventTag.groupBy({
      by: ['tag'],
      _count: { tag: true },
      orderBy: [{ _count: { tag: 'desc' } }, { tag: 'asc' }],
      take: limit,
    });
    return rows.map((r) => ({ tag: r.tag, count: r._count.tag }));
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
    tags: string[];
    formatFields: FormatFields;
  }): Promise<EventDetail> {
    return this.prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        ...input.formatFields,
        organizer: { connect: { id: input.organizerId } },
        candidateDates: { create: input.candidateDates },
        tags: { create: input.tags.map((tag) => ({ tag })) },
      },
      include: eventDetailInclude,
    });
  }

  /** tags を渡した場合は丸ごと置き換える */
  update(
    id: string,
    data: Pick<Prisma.EventUpdateInput, 'title' | 'description' | 'status' | 'format' | 'venue' | 'meetingUrl'>,
    tags?: string[],
  ): Promise<EventDetail> {
    return this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        ...(tags ? { tags: { deleteMany: {}, create: tags.map((tag) => ({ tag })) } } : {}),
      },
      include: eventDetailInclude,
    });
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
