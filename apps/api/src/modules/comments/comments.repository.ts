import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EventComment, Prisma } from '../../generated/prisma/client.js';
import { publicUserSelect } from '../users/users.repository.js';

const commentInclude = {
  user: { select: publicUserSelect },
} satisfies Prisma.EventCommentInclude;

/** 1つのLT会で返すコメントの上限。荒らされても詳細ページが重くならないようにする */
const COMMENT_LIMIT = 200;

export type CommentWithAuthor = Prisma.EventCommentGetPayload<{ include: typeof commentInclude }>;

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 新しい順に最大 COMMENT_LIMIT 件を取り、古い順に並べ替えて返す。excludeUserIds の投稿は除く */
  async findManyByEvent(eventId: string, excludeUserIds: string[] = []): Promise<CommentWithAuthor[]> {
    const comments = await this.prisma.eventComment.findMany({
      where: excludeUserIds.length > 0 ? { eventId, userId: { notIn: excludeUserIds } } : { eventId },
      include: commentInclude,
      orderBy: { createdAt: 'desc' },
      take: COMMENT_LIMIT,
    });
    return comments.reverse();
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
