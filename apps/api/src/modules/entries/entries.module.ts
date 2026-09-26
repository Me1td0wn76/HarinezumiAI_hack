import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';
import { EntriesRepository } from './entries.repository.js';

@Module({
  imports: [EventsModule],
  controllers: [EntriesController],
  providers: [EntriesService, EntriesRepository],
})
export class EntriesModule {}
