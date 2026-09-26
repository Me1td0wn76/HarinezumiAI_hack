import { Transform } from 'class-transformer';
import { ValidateIf } from 'class-validator';

/**
 * 省略（undefined）だけを「変更なし」として検証を飛ばす。@IsOptional は null も飛ばすため、
 * NOT NULL の列に null を送られると Prisma まで届いて 500 になる
 */
export const IsOmittable = () => ValidateIf((_obj: unknown, value: unknown) => value !== undefined);

/** 前後の空白を除いてから検証する（空白だけの名前が MinLength(1) を通らないように） */
export const TrimString = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));
