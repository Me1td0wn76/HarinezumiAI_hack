import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { EventCommentDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { EventsService } from '../events/events.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CommentsRepository } from './comments.repository.js';
import { toEventCommentDto } from './comments.mapper.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly comments: CommentsRepository,
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BlocksRepository,
  ) {}

  /** 非表示のLT会は主催者と運営以外には見せない。ブロックした相手のコメントは本人の画面から除く */
  async list(eventId: string, viewer: User | null): Promise<EventCommentDto[]> {
    await this.events.findVisibleOrThrow(eventId, viewer);
    const blockedIds = viewer ? await this.blocks.findBlockedIds(viewer.id) : [];
    const comments = await this.comments.findManyByEvent(eventId, blockedIds);
    return comments.map(toEventCommentDto);
  }

  async create(eventId: string, user: User, dto: CreateCommentDto): Promise<EventCommentDto> {
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('コメントを入力してください');
    const event = await this.events.findVisibleOrThrow(eventId, user);
    const comment = await this.comments.create({ eventId, userId: user.id, body });
    this.notifications.commentPosted(event, comment.user.displayName, comment.body);
    return toEventCommentDto(comment);
  }

  /** 投稿者本人か、LT会の主催者だけが削除できる */
  async remove(eventId: string, commentId: string, user: User): Promise<void> {
    const event = await this.events.findOrThrow(eventId);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.eventId !== eventId) {
      throw new NotFoundException('コメントが見つかりません');
    }
    if (comment.userId !== user.id && event.organizerId !== user.id) {
      throw new ForbiddenException('投稿者か主催者のみ削除できます');
    }
    await this.comments.delete(commentId);
  }
}
