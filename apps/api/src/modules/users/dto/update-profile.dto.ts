import type { UpdateProfileRequest } from '@lt/shared';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsHandle } from './handle.validator.js';

/**
 * 省略（undefined）だけを「変更なし」として検証を飛ばす。@IsOptional は null も飛ばすため、
 * NOT NULL の列に null を送られると Prisma まで届いて 500 になる
 */
const IsOmittable = () => ValidateIf((_obj: unknown, value: unknown) => value !== undefined);

export class UpdateProfileDto implements UpdateProfileRequest {
  @IsOmittable()
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
