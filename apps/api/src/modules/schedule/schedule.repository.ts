import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { participatedBy } from '../events/events.repository.js';
import { publicUserSelect } from '../users/users.repository.js';

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

const publicScheduleDateInclude = {
  event: {
    select: {
      id: true,
      title: true,
      status: true,
      format: true,
      confirmedDateId: true,
      organizer: { select: publicUserSelect },
    },
  },
} satisfies Prisma.EventDateInclude;

export type PublicScheduleDate = Prisma.EventDateGetPayload<{ include: typeof publicScheduleDateInclude }>;

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
   * みんなのカレンダー: [from, to) にある予定を、LT会ではなく日付（event_dates）の単位で開始日時の昇順に最大 take 件。
   * 日程調整中のLT会は候補日すべて、開催日が決まったLT会は開催日だけ。
   * 終了したもの・運営が非表示にしたもの・excludeOrganizerIds の主催分は除く。
   * 日付の順に取るので、上限で打ち切っても欠けるのは期間の後ろのほうになる（作成日で切ると古くからの予定が抜ける）
   */
  findPublicDatesBetween(
    from: Date,
    to: Date,
    take: number,
    excludeOrganizerIds: string[] = [],
  ): Promise<PublicScheduleDate[]> {
    const visible = { hiddenAt: null, organizerId: { notIn: excludeOrganizerIds } } satisfies Prisma.EventWhereInput;
    return this.prisma.eventDate.findMany({
      where: {
        startsAt: { gte: from, lt: to },
        OR: [
          { event: { ...visible, status: 'OPEN' } },
          // 開催日 = このLT会の confirmedDate として参照されている候補日
          { event: { ...visible, status: 'CONFIRMED' }, confirmedFor: { isNot: null } },
        ],
      },
      include: publicScheduleDateInclude,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take,
    });
  }
}
