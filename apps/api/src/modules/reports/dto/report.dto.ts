import { REPORT_REASON, type ReportReason, type ReportRequest } from '@lt/shared';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportDto implements ReportRequest {
  @IsIn(REPORT_REASON)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  detail?: string | null;
}
