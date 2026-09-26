import type { UpdateProfileRequest } from '@lt/shared';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { IsOmittable, TrimString } from '../../../common/validators.js';
import { IsHandle } from './handle.validator.js';

export class UpdateProfileDto implements UpdateProfileRequest {
  @IsOmittable()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOmittable()
  @IsHandle()
  handle?: string;

  /** null / 空文字で解除。混在コンテンツと平文での追跡を避けるため https のみ */
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] }, { message: 'アバターは https の URL で入力してください' })
  @MaxLength(2048)
  avatarUrl?: string | null;
}
