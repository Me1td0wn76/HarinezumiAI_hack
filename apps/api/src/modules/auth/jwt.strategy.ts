import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '../users/users.repository.js';

export interface JwtPayload {
  /** user.id */
  sub: string;
  /** 発行日時（秒）。jsonwebtoken が自動で付ける */
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** 検証済みトークンから req.user に載せる値を返す */
  async validate(payload: JwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    if (isIssuedBeforePasswordChange(payload, user.passwordChangedAt)) throw new UnauthorizedException();
    return user;
  }
}

/**
 * パスワード再設定より前に発行したトークンか（乗っ取られたセッションを切るため）。
 * iat は秒単位なので、再設定と同じ秒に発行したもの（再設定直後のログイン）は有効として扱う
 */
export function isIssuedBeforePasswordChange(payload: JwtPayload, passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  if (payload.iat === undefined) return true;
  return payload.iat < Math.floor(passwordChangedAt.getTime() / 1000);
}
