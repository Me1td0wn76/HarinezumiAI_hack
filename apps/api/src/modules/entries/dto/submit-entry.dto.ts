import {
  ENTRY_ROLE,
  TALK_DETAIL_MAX_LENGTH,
  TALK_DURATION_MAX_MINUTES,
  TALK_TITLE_MAX_LENGTH,
  type EntryRole,
  type SubmitEntryRequest,
} from '@lt/shared';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SubmitEntryDto implements SubmitEntryRequest {
  @IsIn(ENTRY_ROLE)
  role: EntryRole;

  /** SPEAKER のとき必須（空白だけも不可）。Service で確認する */
  @IsOptional()
  @IsString()
  @MaxLength(TALK_TITLE_MAX_LENGTH)
  talkTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(TALK_DETAIL_MAX_LENGTH)
  talkDetail?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(TALK_DURATION_MAX_MINUTES)
  durationMinutes?: number | null;
}
