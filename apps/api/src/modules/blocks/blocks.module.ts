import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { BlocksController } from './blocks.controller.js';
import { BlocksService } from './blocks.service.js';
import { BlocksRepository } from './blocks.repository.js';

@Module({
  imports: [UsersModule],
  controllers: [BlocksController],
  providers: [BlocksService, BlocksRepository],
  // EventsService が一覧からブロックした相手のLT会を除くのに使う
  exports: [BlocksRepository],
})
export class BlocksModule {}
