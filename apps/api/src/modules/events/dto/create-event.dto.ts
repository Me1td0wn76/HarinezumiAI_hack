import type { CreateEventRequest } from '@lt/shared';
import { Type } from 'class-transformer';
import { TAG_MAX_PER_EVENT } from '@lt/shared';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { CandidateDateDto } from './candidate-date.dto.js';

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

  /** 正規化前の生の値。個数は正規化後にも検証する */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(TAG_MAX_PER_EVENT * 2)
  @IsString({ each: true })
  tags?: string[];
}
