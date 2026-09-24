import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@Controller('events/:id/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** 公開。古い順 */
  @Get()
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.comments.list(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User, @Body() dto: CreateCommentDto) {
    return this.comments.create(id, user, dto);
  }

  @Delete(':commentId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.comments.remove(id, commentId, user);
  }
}
