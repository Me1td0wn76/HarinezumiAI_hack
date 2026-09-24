import { IsOptional, IsUUID } from 'class-validator';

export class ListNotificationsQueryDto {
  /** この通知より古いものを返す（前ページの nextCursor） */
  @IsOptional()
  @IsUUID()
  before?: string;
}
