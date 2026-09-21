import type { ConfirmEventRequest } from '@lt/shared';
import { IsUUID } from 'class-validator';

export class ConfirmEventDto implements ConfirmEventRequest {
  @IsUUID()
  eventDateId: string;
}
