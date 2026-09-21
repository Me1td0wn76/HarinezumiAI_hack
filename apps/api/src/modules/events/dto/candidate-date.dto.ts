import type { CandidateDateInput } from '@lt/shared';
import { IsISO8601, IsOptional } from 'class-validator';

export class CandidateDateDto implements CandidateDateInput {
  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}
