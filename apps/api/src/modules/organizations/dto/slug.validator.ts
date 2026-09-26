import { ORGANIZATION_SLUG_PATTERN, RESERVED_ORGANIZATION_SLUGS } from '@lt/shared';
import { Transform } from 'class-transformer';
import { IsNotIn, IsString, Matches, ValidateIf } from 'class-validator';

/**
 * 省略（undefined）だけを「変更なし」として検証を飛ばす。@IsOptional は null も飛ばすため、
 * NOT NULL の列（name / slug）に null を送られると Prisma まで届いて 500 になる
 */
export const IsOmittable = () => ValidateIf((_obj: unknown, value: unknown) => value !== undefined);

/** 前後の空白を除いてから検証する（空白だけの団体名を通さない） */
export const TrimString = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/** 前後の空白を除き小文字にしてから、形式と予約語を検証する（大文字で入力しても通す） */
export function IsOrganizationSlug(): PropertyDecorator {
  return (target, key) => {
    Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))(
      target,
      key,
    );
    IsString()(target, key);
    Matches(ORGANIZATION_SLUG_PATTERN, {
      message: 'ID は3〜30文字の半角英小文字・数字・ハイフンで入力してください（先頭と末尾はハイフン以外）',
    })(target, key);
    IsNotIn(RESERVED_ORGANIZATION_SLUGS, { message: 'この ID は使えません' })(target, key);
  };
}
