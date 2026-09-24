import type { UpdateEventRequest } from '@lt/shared';
import { TAG_MAX_PER_EVENT } from '@lt/shared';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(TAG_MAX_PER_EVENT * 2)
  @IsString({ each: true })
  tags?: string[];
}
