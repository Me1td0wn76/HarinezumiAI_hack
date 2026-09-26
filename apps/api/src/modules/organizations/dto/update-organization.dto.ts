import type { UpdateOrganizationRequest } from '@lt/shared';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsOptionalDiscordWebhookUrl } from '../../events/dto/webhook-url.validator.js';
import { IsOmittable, IsOrganizationSlug, TrimString } from './slug.validator.js';

export class UpdateOrganizationDto implements UpdateOrganizationRequest {
  @IsOmittable()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOmittable()
  @IsOrganizationSlug()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptionalDiscordWebhookUrl()
  webhookUrl?: string | null;
}
