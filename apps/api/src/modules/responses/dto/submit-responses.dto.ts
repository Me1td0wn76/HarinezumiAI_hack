import type { SubmitResponsesRequest } from '@lt/shared';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ResponseInputDto } from './response-input.dto.js';

export class SubmitResponsesDto implements SubmitResponsesRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResponseInputDto)
  responses: ResponseInputDto[];
}
