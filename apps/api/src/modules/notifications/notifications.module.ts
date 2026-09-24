import { Global, Module } from '@nestjs/common';
import { DiscordWebhookService } from './discord-webhook.service.js';
import { InboxService } from './inbox.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [DiscordWebhookService, NotificationsService, NotificationsRepository, InboxService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
