import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { MyEventsController } from './my-events.controller.js';
import { TagsController } from './tags.controller.js';
import { EventsService } from './events.service.js';
import { BlocksModule } from '../blocks/blocks.module.js';
import { EventsRepository } from './events.repository.js';
import { EntriesRepository } from '../entries/entries.repository.js';

@Module({
  imports: [BlocksModule],
  controllers: [EventsController, MyEventsController, TagsController],
  // EntriesRepository は詳細の参加表明一覧（EventsService.toDetail）でも使うのでここで提供し、EntriesModule にも渡す
  // （EntriesModule が EventsModule を import しているため、逆向きに import すると循環する）
  providers: [EventsService, EventsRepository, EntriesRepository],
  exports: [EventsService, EventsRepository, EntriesRepository],
})
export class EventsModule {}
