import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { OAuthService } from './oauth.service.js';
import { OAuthAccountsRepository } from './oauth-accounts.repository.js';
import { GoogleOAuthProvider } from './providers/google.provider.js';
import { PasswordResetService } from './password-reset.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // '7d' のような ms 形式。型が string より狭いのでキャストする
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PasswordResetService,
    PasswordResetRepository,
    OAuthService,
    OAuthAccountsRepository,
    GoogleOAuthProvider,
  ],
})
export class AuthModule {}
