import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { OAuthService } from './oauth.service.js';
import { OAuthAuthorizeQueryDto, OAuthLoginDto } from './dto/oauth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OAuthService,
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

  /** 使えるソーシャルログイン。ログイン画面でボタンを出すかの判定に使う */
  @Get('oauth/providers')
  providers() {
    return this.oauth.listProviders();
  }

  /** プロバイダの認可画面の URL。state と PKCE の code_challenge は web が作って Cookie に保持する */
  @Get('oauth/:provider/url')
  @Throttle(THROTTLE.oauthStart)
  authorizeUrl(@Param('provider') provider: string, @Query() query: OAuthAuthorizeQueryDto) {
    return this.oauth.authorizeUrl(provider, query);
  }

  /** web のコールバックが受け取った認可コードで、ログイン（未登録なら登録）する */
  @Post('oauth/:provider')
  @Throttle(THROTTLE.oauthCallback)
  @HttpCode(200)
  oauthLogin(@Param('provider') provider: string, @Body() dto: OAuthLoginDto) {
    return this.oauth.login(provider, dto);
  }
}
