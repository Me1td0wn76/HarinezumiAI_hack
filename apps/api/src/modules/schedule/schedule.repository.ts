import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';

const scheduleInclude = (userId: string) =>
  ({
    candidateDates: {
      orderBy: { startsAt: 'asc' },
      // 自分の回答だけを載せる
      include: { responses: { where: { userId }, select: { availability: true } } },
    },
  }) satisfies Prisma.EventInclude;

export type ScheduleEvent = Prisma.EventGetPayload<{ include: ReturnType<typeof scheduleInclude> }>;

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 自分が主催した、またはいずれかの候補日に回答したLT会（回答者側は運営が非表示にしたLT会を除く） */
  findForUser(userId: string): Promise<ScheduleEvent[]> {
    return this.prisma.event.findMany({
      where: {
        OR: [
          { organizerId: userId },
          {
            hiddenAt: null,
            candidateDates: { some: { responses: { some: { userId } } } },
          },
        ],
      },
      include: scheduleInclude(userId),
      orderBy: { createdAt: 'desc' },
    });
  }
}
