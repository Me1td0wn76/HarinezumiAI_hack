import type { LoginRequest } from '@lt/shared';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto implements LoginRequest {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
