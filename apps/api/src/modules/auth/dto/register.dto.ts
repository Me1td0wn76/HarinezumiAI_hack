import type { RegisterRequest } from '@lt/shared';
import { Equals, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { IsHandle } from '../../users/dto/handle.validator.js';

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;

  @IsHandle()
  handle: string;

  @Equals(true, { message: '利用規約とプライバシーポリシーへの同意が必要です' })
  agreeToTerms: boolean;
}
