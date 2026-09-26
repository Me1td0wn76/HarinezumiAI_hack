import { Injectable } from '@nestjs/common';
import type { EntryRole } from '@lt/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EventEntry, Prisma } from '../../generated/prisma/client.js';
import { publicUserSelect } from '../users/users.repository.js';

const entryInclude = {
  user: { select: publicUserSelect },
} satisfies Prisma.EventEntryInclude;

export type EntryWithUser = Prisma.EventEntryGetPayload<{ include: typeof entryInclude }>;

export interface EntryFields {
  role: EntryRole;
  talkTitle: string | null;
  talkDetail: string | null;
  durationMinutes: number | null;
}

@Injectable()
export class EntriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(eventId: string, userId: string): Promise<EventEntry | null> {
    return this.prisma.eventEntry.findUnique({ where: { eventId_userId: { eventId, userId } } });
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
