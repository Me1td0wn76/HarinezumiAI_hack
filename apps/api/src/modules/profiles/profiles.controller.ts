import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ProfilesService } from './profiles.service.js';

/**
 * GET /users/:handle。/users/me（UsersController）と同じパスに当たるため、
 * AppModule では UsersModule より後に読み込む（先に登録したルートが優先される。"me" は予約語でもある）
 */
@Controller('users')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  /** 公開情報・主催したLT会・参加予定。ログインは任意 */
  @Get(':handle')
  @UseGuards(OptionalJwtAuthGuard)
  show(@Param('handle') handle: string, @CurrentUser() viewer: User | null) {
    return this.profiles.getByHandle(handle, viewer);
  }
}
