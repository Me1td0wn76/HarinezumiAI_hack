import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';

/**
 * JwtAuthGuard / OptionalJwtAuthGuard が req.user に載せたユーザーを取り出す。
 * OptionalJwtAuthGuard 配下では null になり得る。
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User | null => {
  const req = ctx.switchToHttp().getRequest<{ user?: User }>();
  return req.user ?? null;
});
