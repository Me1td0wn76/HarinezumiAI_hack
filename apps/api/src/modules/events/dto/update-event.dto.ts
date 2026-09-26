import type { UpdateEventRequest } from '@lt/shared';
import { EVENT_FORMAT, TAG_MAX_PER_EVENT, type EventFormat } from '@lt/shared';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsOptionalDiscordWebhookUrl } from './webhook-url.validator.js';

export class UpdateEventDto implements UpdateEventRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptionalDiscordWebhookUrl()
  webhookUrl?: string | null;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(TAG_MAX_PER_EVENT * 2)
  @IsString({ each: true })
  tags?: string[];

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

  /** null で団体から外す。付け替え先の団体のメンバーであること */
  @IsOptional()
  @ValidateIf((_obj, value) => value !== '')
  @IsUUID()
  organizationId?: string | null;
}
