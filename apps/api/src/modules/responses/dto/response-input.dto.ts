import {
  AVAILABILITY,
  type Availability,
  type ResponseInput,
} from '@lt/shared';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ResponseInputDto implements ResponseInput {
  @IsUUID()
  eventDateId: string;

  @IsIn(AVAILABILITY)
  availability: Availability;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string | null;
}
