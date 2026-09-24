import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EventComment, Prisma } from '../../generated/prisma/client.js';

const commentInclude = {
  user: { select: { id: true, displayName: true } },
} satisfies Prisma.EventCommentInclude;

export type CommentWithAuthor = Prisma.EventCommentGetPayload<{ include: typeof commentInclude }>;

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByEvent(eventId: string): Promise<CommentWithAuthor[]> {
    return this.prisma.eventComment.findMany({
      where: { eventId },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string): Promise<EventComment | null> {
    return this.prisma.eventComment.findUnique({ where: { id } });
  }

  create(input: { eventId: string; userId: string; body: string }): Promise<CommentWithAuthor> {
    return this.prisma.eventComment.create({ data: input, include: commentInclude });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.eventComment.delete({ where: { id } });
  }
}
