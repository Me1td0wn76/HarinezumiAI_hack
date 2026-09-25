import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsRepository, RETENTION_DAYS } from './notifications.repository.js';

/** 古い通知を定期的に削除する。未読の通知は残す（読むまで消さない） */
@Injectable()
export class NotificationsCleanupService {
  private readonly logger = new Logger(NotificationsCleanupService.name);

  constructor(private readonly notifications: NotificationsRepository) {}

  /** 毎日 4:00（日本時間）。利用の少ない時間帯に行う */
  @Cron('0 4 * * *', { name: 'notifications-cleanup', timeZone: 'Asia/Tokyo' })
  async deleteOldReadNotifications(now = new Date()): Promise<void> {
    const before = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    try {
      const count = await this.notifications.deleteReadBefore(before);
      if (count > 0) this.logger.log(`既読から${RETENTION_DAYS}日たった通知を ${count} 件削除しました`);
    } catch (err) {
      // 次の日にまた実行されるので、ここでは止めずにログに残す
      this.logger.warn(`古い通知の削除に失敗: ${String(err)}`);
    }
  }
}
