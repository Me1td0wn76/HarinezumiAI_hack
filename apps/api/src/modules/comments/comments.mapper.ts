import type { EventCommentDto } from '@lt/shared';
import { toPublicUserDto } from '../users/users.mapper.js';
import type { CommentWithAuthor } from './comments.repository.js';

export function toEventCommentDto(comment: CommentWithAuthor): EventCommentDto {
  return {
    id: comment.id,
    body: comment.body,
    author: toPublicUserDto(comment.user),
    createdAt: comment.createdAt.toISOString(),
  };
}
