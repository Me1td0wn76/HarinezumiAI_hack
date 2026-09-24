import type { ConfirmPasswordResetRequest, RequestPasswordResetRequest } from '@lt/shared';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestPasswordResetDto implements RequestPasswordResetRequest {
  @IsEmail()
  email: string;
}

export class ConfirmPasswordResetDto implements ConfirmPasswordResetRequest {
  @IsString()
  @MaxLength(200)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
