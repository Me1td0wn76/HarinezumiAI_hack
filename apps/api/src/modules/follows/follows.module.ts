import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { FollowsController } from './follows.controller.js';
import { FollowsService } from './follows.service.js';
import { FollowsRepository } from './follows.repository.js';

@Module({
  imports: [UsersModule],
  controllers: [FollowsController],
  providers: [FollowsService, FollowsRepository],
  // 公開プロフィール（ProfilesModule）がフォロワー数・フォロー中かを読む
  exports: [FollowsRepository],
})
export class FollowsModule {}
