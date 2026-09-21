import type { CreateEventRequest } from '@lt/shared';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
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
}
