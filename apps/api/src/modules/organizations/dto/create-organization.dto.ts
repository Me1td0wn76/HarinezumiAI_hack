import type { CreateOrganizationRequest } from '@lt/shared';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsOptionalDiscordWebhookUrl } from '../../events/dto/webhook-url.validator.js';
import { IsOrganizationSlug, TrimString } from './slug.validator.js';

export class CreateOrganizationDto implements CreateOrganizationRequest {
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOrganizationSlug()
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptionalDiscordWebhookUrl()
  webhookUrl?: string | null;
}
