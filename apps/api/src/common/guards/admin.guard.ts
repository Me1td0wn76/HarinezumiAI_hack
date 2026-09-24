import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';

/**
 * 運営（role = ADMIN）だけを通す。JwtAuthGuard の後ろに付けて使う:
 * `@UseGuards(JwtAuthGuard, AdminGuard)`
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest<{ user?: User }>().user;
    if (user?.role !== 'ADMIN') throw new ForbiddenException('運営のみ操作できます');
    return true;
  }
}
