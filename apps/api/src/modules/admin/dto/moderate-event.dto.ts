import type { ModerateEventRequest } from '@lt/shared';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateEventDto implements ModerateEventRequest {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}
