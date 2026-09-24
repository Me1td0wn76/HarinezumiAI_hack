import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { MyEventsController } from './my-events.controller.js';
import { EventsService } from './events.service.js';
import { EventsRepository } from './events.repository.js';

@Module({
  controllers: [EventsController, MyEventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
