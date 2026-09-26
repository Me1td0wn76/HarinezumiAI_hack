import { IsISO8601 } from 'class-validator';

/** GET /schedule のクエリパラメータ。期間は [from, to) */
export class PublicScheduleQueryDto {
  @IsISO8601({ strict: true })
  from: string;

  @IsISO8601({ strict: true })
  to: string;
}
