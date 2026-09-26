import { Injectable } from '@nestjs/common';
import type { EntryRole } from '@lt/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { publicUserSelect } from '../users/users.repository.js';

const entryInclude = {
  user: { select: publicUserSelect },
} satisfies Prisma.EventEntryInclude;

export type EntryWithUser = Prisma.EventEntryGetPayload<{ include: typeof entryInclude }>;

/**
 * 詳細で返す参加表明の上限（主催者以外）。荒らされても詳細ページが重くならないようにする（コメント欄と同じ考え方）。
 * 主催者には上限なしで全員を返す（登壇者を把握するのが主催者向けの中心的な要件のため）
 */
export const ENTRY_LIMIT = 500;

export interface EntryFields {
  role: EntryRole;
  talkTitle: string | null;
  talkDetail: string | null;
  durationMinutes: number | null;
}

export interface EventEntries {
  /** 表明の古い順 */
  list: EntryWithUser[];
  /** 閲覧者自身の表明。list の範囲外（上限超え）でも入る */
  mine: EntryWithUser | null;
}

/** event_entries の読み書きはこのリポジトリに集める（詳細の一覧も EventsService からここを呼ぶ） */
@Injectable()
export class EntriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * LT会の参加表明の一覧と、閲覧者自身の表明。
   * 除外は SQL で行い、上限があるときは新しい順に取ってから古い順に並べ直す（CommentsRepository.findManyByEvent と同じ）。
   * こうすると除外した分で件数が減らず、上限を超えても新しい表明が見えなくなることがない
   * @param limit null なら上限なし（主催者）
   */
  async findForEvent(
    eventId: string,
    opts: { excludeUserIds?: string[]; viewerId?: string | null; limit: number | null },
  ): Promise<EventEntries> {
    const excludeUserIds = opts.excludeUserIds ?? [];
    const [rows, mine] = await Promise.all([
      this.prisma.eventEntry.findMany({
        where: excludeUserIds.length > 0 ? { eventId, userId: { notIn: excludeUserIds } } : { eventId },
        include: entryInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(opts.limit !== null ? { take: opts.limit } : {}),
      }),
      opts.viewerId
        ? this.prisma.eventEntry.findUnique({
            where: { eventId_userId: { eventId, userId: opts.viewerId } },
            include: entryInclude,
          })
        : Promise.resolve(null),
    ]);
    return { list: rows.reverse(), mine };
  }

  /** 既存の表明の役割（通知を出すかの判定用）。無ければ null */
  async findRole(eventId: string, userId: string): Promise<EntryRole | null> {
    const row = await this.prisma.eventEntry.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { role: true },
    });
    return row?.role ?? null;
  }

  /** 1人1件。既にあれば役割・発表内容を上書きする */
  upsert(eventId: string, userId: string, fields: EntryFields): Promise<EntryWithUser> {
    return this.prisma.eventEntry.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, ...fields },
      update: fields,
      include: entryInclude,
    });
  }

  /** 削除した件数（0 か 1）を返す */
  async delete(eventId: string, userId: string): Promise<number> {
    const { count } = await this.prisma.eventEntry.deleteMany({ where: { eventId, userId } });
    return count;
  }
}
