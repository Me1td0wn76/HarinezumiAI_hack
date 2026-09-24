import type { UpdateEventRequest } from '@lt/shared';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
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
}
