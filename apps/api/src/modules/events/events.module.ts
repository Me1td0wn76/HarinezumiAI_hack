import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { MyEventsController } from './my-events.controller.js';
import { TagsController } from './tags.controller.js';
import { EventsService } from './events.service.js';
import { BlocksModule } from '../blocks/blocks.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { OrganizationEventsController } from './organization-events.controller.js';
import { EventsRepository } from './events.repository.js';

@Module({
  imports: [BlocksModule, OrganizationsModule],
  controllers: [EventsController, MyEventsController, TagsController, OrganizationEventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
