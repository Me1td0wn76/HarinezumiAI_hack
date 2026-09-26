import { ORGANIZATION_SLUG_PATTERN, RESERVED_ORGANIZATION_SLUGS } from '@lt/shared';
import { Transform } from 'class-transformer';
import { IsNotIn, IsString, Matches } from 'class-validator';

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
