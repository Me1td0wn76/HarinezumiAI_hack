import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminRepository } from './admin.repository.js';

@Module({
  imports: [EventsModule, ReportsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule {}
