import {
  EVENT_FORMAT,
  EVENT_PAGE_SIZE,
  EVENT_PAGE_SIZE_MAX,
  EVENT_SEARCH_MAX_LENGTH,
  EVENT_STATUS,
  ORGANIZATION_SLUG_MAX_LENGTH,
  TAG_MAX_LENGTH,
  type EventFormat,
  type EventListQuery,
  type EventStatus,
} from '@lt/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/** GET /events のクエリパラメータ */
export class ListEventsQueryDto implements EventListQuery {
  /** 前ページの nextCursor（中身は Repository の encodeEventCursor が決める） */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EVENT_PAGE_SIZE_MAX)
  limit: number = EVENT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @MaxLength(TAG_MAX_LENGTH)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(EVENT_SEARCH_MAX_LENGTH)
  q?: string;

  @IsOptional()
  @IsIn(EVENT_STATUS)
  status?: EventStatus;

  @IsOptional()
  @IsIn(EVENT_FORMAT)
  format?: EventFormat;

  @IsOptional()
  @IsUUID()
  organizerId?: string;

  /** 団体の slug */
  @IsOptional()
  @IsString()
  @MaxLength(ORGANIZATION_SLUG_MAX_LENGTH)
  organization?: string;
}
