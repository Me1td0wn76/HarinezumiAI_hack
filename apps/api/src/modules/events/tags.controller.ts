import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { TopTagsQueryDto } from './dto/top-tags-query.dto.js';

@Controller('tags')
export class TagsController {
  constructor(private readonly events: EventsService) {}

  /** 使用回数の多いタグ（発見画面のチップに使う） */
  @Get()
  top(@Query() query: TopTagsQueryDto) {
    return this.events.topTags(query.limit);
  }
}
