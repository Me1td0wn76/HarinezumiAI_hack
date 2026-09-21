import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { ResponsesController } from './responses.controller.js';
import { ResponsesService } from './responses.service.js';
import { ResponsesRepository } from './responses.repository.js';

@Module({
  imports: [EventsModule],
  controllers: [ResponsesController],
  providers: [ResponsesService, ResponsesRepository],
  exports: [ResponsesService],
})
export class ResponsesModule {}
