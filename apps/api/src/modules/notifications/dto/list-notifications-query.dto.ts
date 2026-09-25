import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListNotificationsQueryDto {
  /** 前ページの nextCursor（GET /events と同じ不透明な文字列） */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}
