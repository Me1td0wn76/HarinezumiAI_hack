import { Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';

/**
 * ログイン必須のエンドポイントに付ける。
 *
 * AuthGuard() の派生クラスは親の @Optional() を引き継がない（Nest 12 は own metadata しか見ない）ため、
 * PassportModule を import していないモジュールでも使えるよう、明示的に @Optional() を付け直している。
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }
}
