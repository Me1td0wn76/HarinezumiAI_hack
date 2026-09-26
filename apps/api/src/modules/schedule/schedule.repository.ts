import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { participatedBy } from '../events/events.repository.js';
import { publicUserSelect } from '../users/users.repository.js';

/** みんなのカレンダーで1回に返すLT会の上限。期間の上限（PUBLIC_SCHEDULE_MAX_DAYS）と合わせて応答の大きさを抑える */
export const PUBLIC_SCHEDULE_EVENT_LIMIT = 500;

const scheduleInclude = (userId: string) =>
  ({
    candidateDates: {
      orderBy: { startsAt: 'asc' },
      // 自分の回答だけを載せる
      include: { responses: { where: { userId }, select: { availability: true } } },
    },
    // 自分の参加表明だけを載せる
    entries: { where: { userId }, select: { role: true } },
  }) satisfies Prisma.EventInclude;

export type ScheduleEvent = Prisma.EventGetPayload<{ include: ReturnType<typeof scheduleInclude> }>;

const publicScheduleInclude = (dateFilter: Prisma.EventDateWhereInput) =>
  ({
    organizer: { select: publicUserSelect },
    candidateDates: { where: dateFilter, orderBy: { startsAt: 'asc' } },
  }) satisfies Prisma.EventInclude;

export type PublicScheduleEvent = Prisma.EventGetPayload<{ include: ReturnType<typeof publicScheduleInclude> }>;

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 自分が主催した、または参加した（回答・参加表明）LT会（参加側は運営が非表示にしたLT会を除く） */
  findForUser(userId: string): Promise<ScheduleEvent[]> {
    return this.prisma.event.findMany({
      where: {
        OR: [{ organizerId: userId }, { hiddenAt: null, ...participatedBy(userId) }],
      },
      include: scheduleInclude(userId),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * みんなのカレンダー: [from, to) に候補日（日程調整中）か開催日（決定済み）があるLT会。
   * 終了したもの・運営が非表示にしたもの・excludeOrganizerIds の主催分は除く。candidateDates は期間内のものだけ載せる
   */
  findPublicBetween(from: Date, to: Date, excludeOrganizerIds: string[] = []): Promise<PublicScheduleEvent[]> {
    const inRange = { startsAt: { gte: from, lt: to } };
    return this.prisma.event.findMany({
      where: {
        hiddenAt: null,
        organizerId: { notIn: excludeOrganizerIds },
        OR: [
          { status: 'OPEN', candidateDates: { some: inRange } },
          { status: 'CONFIRMED', confirmedDate: inRange },
        ],
      },
      include: publicScheduleInclude(inRange),
      orderBy: { createdAt: 'desc' },
      take: PUBLIC_SCHEDULE_EVENT_LIMIT,
    });
  }
}
