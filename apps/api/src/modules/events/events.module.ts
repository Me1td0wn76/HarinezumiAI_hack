import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { TagsController } from './tags.controller.js';
import { EventsService } from './events.service.js';
import { BlocksModule } from '../blocks/blocks.module.js';
import { EventsRepository } from './events.repository.js';

@Module({
  imports: [BlocksModule],
  controllers: [EventsController, TagsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
