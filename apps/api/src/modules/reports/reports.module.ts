import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { UsersModule } from '../users/users.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ReportsRepository } from './reports.repository.js';

@Module({
  imports: [EventsModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  // 運営画面（AdminModule）が集計に使う
  exports: [ReportsRepository],
})
export class ReportsModule {}
