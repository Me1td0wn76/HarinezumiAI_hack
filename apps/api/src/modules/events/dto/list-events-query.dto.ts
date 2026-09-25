import { EVENT_PAGE_SIZE, EVENT_PAGE_SIZE_MAX, EVENT_STATUS, type EventListQuery, type EventStatus } from '@lt/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/** GET /events のクエリパラメータ */
export class ListEventsQueryDto implements EventListQuery {
  /** 前ページ最後の event.id */
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EVENT_PAGE_SIZE_MAX)
  limit: number = EVENT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(EVENT_STATUS)
  status?: EventStatus;

  @IsOptional()
  @IsUUID()
  organizerId?: string;
}
