import { IsOptional, IsUUID } from 'class-validator';

export class ListNotificationsQueryDto {
  /** 前ページの nextCursor。この通知より古いものを返す */
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
