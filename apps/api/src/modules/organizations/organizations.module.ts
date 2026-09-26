import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { BlocksModule } from '../blocks/blocks.module.js';
import { OrganizationsController } from './organizations.controller.js';
import { MyOrganizationsController } from './my-organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsRepository } from './organizations.repository.js';

/**
 * 団体。LT会側（EventsModule）が所属の確認と団体ごとの一覧のために OrganizationsRepository を読む。
 * 逆向きの依存は作らない（団体ごとのLT会一覧も EventsModule 側に置く）
 */
@Module({
  imports: [UsersModule, BlocksModule],
  controllers: [OrganizationsController, MyOrganizationsController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsRepository],
})
export class OrganizationsModule {}
