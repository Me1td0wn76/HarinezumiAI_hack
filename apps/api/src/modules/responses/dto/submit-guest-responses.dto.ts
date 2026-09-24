import type { SubmitGuestResponsesRequest } from '@lt/shared';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ResponseInputDto } from './response-input.dto.js';

export class SubmitGuestResponsesDto implements SubmitGuestResponsesRequest {
  /** ブラウザが生成して保持する識別子 */
  @IsString()
  @Length(8, 64)
  guestKey: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  guestName: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResponseInputDto)
  responses: ResponseInputDto[];
}
