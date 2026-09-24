import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PasswordResetService } from './password-reset.service.js';
import { ConfirmPasswordResetDto, RequestPasswordResetDto } from './dto/password-reset.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('register')
  @Throttle(THROTTLE.register)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Throttle(THROTTLE.login)
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** 登録の有無に関係なく 204 を返す */
  @Post('password-reset/request')
  @Throttle(THROTTLE.passwordResetRequest)
  @HttpCode(204)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.passwordReset.request(dto);
  }

  @Post('password-reset/confirm')
  @Throttle(THROTTLE.passwordResetConfirm)
  @HttpCode(204)
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.passwordReset.confirm(dto);
  }
}
