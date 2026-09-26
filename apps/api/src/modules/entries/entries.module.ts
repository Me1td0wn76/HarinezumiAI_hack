import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';

@Module({
  // EntriesRepository は EventsModule が提供している（詳細の参加表明一覧でも使うため）
  imports: [EventsModule],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
