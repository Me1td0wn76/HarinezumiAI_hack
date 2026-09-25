import { HANDLE_PATTERN, RESERVED_HANDLES } from '@lt/shared';
import { Transform } from 'class-transformer';
import { IsNotIn, IsString, Matches } from 'class-validator';

/** 前後の空白を除き小文字にしてから、形式と予約語を検証する（大文字で入力しても通す） */
export function IsHandle(): PropertyDecorator {
  return (target, key) => {
    Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))(
      target,
      key,
    );
    IsString()(target, key);
    Matches(HANDLE_PATTERN, { message: 'ハンドルは3〜20文字の半角英数字と _ で入力してください' })(target, key);
    IsNotIn(RESERVED_HANDLES, { message: 'このハンドルは使えません' })(target, key);
  };
}
