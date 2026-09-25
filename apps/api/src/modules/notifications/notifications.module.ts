import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DiscordWebhookService } from './discord-webhook.service.js';
import { InboxService } from './inbox.service.js';
import { NotificationsCleanupService } from './notifications-cleanup.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

@Global()
@Module({
  // 古い通知の定期削除（NotificationsCleanupService）に使う。
  // 他のモジュールでも定期実行が要るようになったら、forRoot() は AppModule に移す（二重に登録しないため）
  imports: [ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [
    DiscordWebhookService,
    NotificationsService,
    NotificationsRepository,
    InboxService,
    NotificationsCleanupService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
