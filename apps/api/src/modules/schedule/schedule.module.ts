import { Module } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module.js';
import { PublicScheduleController } from './public-schedule.controller.js';
import { ScheduleController } from './schedule.controller.js';
import { ScheduleService } from './schedule.service.js';
import { ScheduleRepository } from './schedule.repository.js';

@Module({
  imports: [BlocksModule],
  controllers: [ScheduleController, PublicScheduleController],
  providers: [ScheduleService, ScheduleRepository],
})
export class ScheduleModule {}
