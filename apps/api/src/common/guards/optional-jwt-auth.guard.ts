import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * ログインしていれば req.user を載せ、していなくてもエラーにしないガード。
 * 主催者にだけ追加情報を返したい公開エンドポイントで使う。
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
