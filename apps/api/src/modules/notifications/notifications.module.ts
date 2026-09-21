import { Global, Module } from '@nestjs/common';
import { DiscordWebhookService } from './discord-webhook.service.js';
import { NotificationsService } from './notifications.service.js';

@Global()
@Module({
  providers: [DiscordWebhookService, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
