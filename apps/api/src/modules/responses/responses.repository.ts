import { Injectable } from '@nestjs/common';
import type { Availability } from '@lt/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ResponseValue {
  eventDateId: string;
  availability: Availability;
  comment: string | null;
}

@Injectable()
export class ResponsesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** ログインユーザーの回答を候補日ごとに upsert する */
  async upsertForUser(userId: string, values: ResponseValue[]): Promise<void> {
    await this.prisma.$transaction(
      values.map((v) =>
        this.prisma.dateResponse.upsert({
          where: { eventDateId_userId: { eventDateId: v.eventDateId, userId } },
          create: {
            eventDateId: v.eventDateId,
            userId,
            availability: v.availability,
            comment: v.comment,
          },
          update: { availability: v.availability, comment: v.comment },
        }),
      ),
    );
  }

  /** ゲストの回答を候補日ごとに upsert する。表示名は毎回上書きする */
  async upsertForGuest(
    guestKey: string,
    guestName: string,
    values: ResponseValue[],
  ): Promise<void> {
    await this.prisma.$transaction(
      values.map((v) =>
        this.prisma.dateResponse.upsert({
          where: {
            eventDateId_guestKey: { eventDateId: v.eventDateId, guestKey },
          },
          create: {
            eventDateId: v.eventDateId,
            guestKey,
            guestName,
            availability: v.availability,
            comment: v.comment,
          },
          update: {
            guestName,
            availability: v.availability,
            comment: v.comment,
          },
        }),
      ),
    );
  }
}
