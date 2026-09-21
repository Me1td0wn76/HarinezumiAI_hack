import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { ResponsesModule } from '../responses/responses.module.js';
import { ShareController } from './share.controller.js';
import { ShareService } from './share.service.js';

@Module({
  imports: [EventsModule, ResponsesModule],
  controllers: [ShareController],
  providers: [ShareService],
})
export class ShareModule {}
