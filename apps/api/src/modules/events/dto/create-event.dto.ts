import type { CreateEventRequest } from '@lt/shared';
import { Type } from 'class-transformer';
import { EVENT_FORMAT, TAG_MAX_PER_EVENT, type EventFormat } from '@lt/shared';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CandidateDateDto } from './candidate-date.dto.js';
import { IsOptionalDiscordWebhookUrl } from './webhook-url.validator.js';

export class CreateEventDto implements CreateEventRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(5000)
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CandidateDateDto)
  candidateDates: CandidateDateDto[];

  @IsOptionalDiscordWebhookUrl()
  webhookUrl?: string | null;
  /** 正規化前の生の値。個数は正規化後にも検証する */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(TAG_MAX_PER_EVENT * 2)
  @IsString({ each: true })
  tags?: string[];

  /** 省略時は ONLINE */
  @IsOptional()
  @IsIn(EVENT_FORMAT)
  format?: EventFormat;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  venue?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  meetingUrl?: string | null;

  /** 紐付ける団体。作成者がその団体のメンバーであること。null・空文字は団体なし（PATCH と揃える） */
  @IsOptional()
  @ValidateIf((_obj, value) => value !== '')
  @IsUUID()
  organizationId?: string | null;
}
