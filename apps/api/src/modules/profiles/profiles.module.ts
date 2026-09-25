import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { EventsModule } from '../events/events.module.js';
import { BlocksModule } from '../blocks/blocks.module.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

/**
 * 公開プロフィール。ユーザーとLT会の両方を読むため、UsersModule に置くと
 * Users → Events → Blocks → Users の循環になる。独立したモジュールにして一方向の依存に保つ
 */
@Module({
  imports: [UsersModule, EventsModule, BlocksModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
