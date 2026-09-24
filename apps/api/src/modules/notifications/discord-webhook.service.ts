import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Discord の Incoming Webhook にメッセージを投げる。
 * URL が未設定なら何もしない。通知の失敗で本処理を止めないよう、例外は投げずにログに残す。
 */
@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);
  private readonly url: string | undefined;

  constructor(config: ConfigService) {
    this.url = config.get<string>('DISCORD_WEBHOOK_URL') || undefined;
    if (!this.url) this.logger.log('DISCORD_WEBHOOK_URL 未設定のため Discord 通知は無効');
  }

  get enabled(): boolean {
    return this.url !== undefined;
  }

  async send(content: string): Promise<void> {
    if (!this.url) return;
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 本文にユーザー入力（タイトル・コメント）が入るので、@everyone / @here / ロールなどのメンションは無効にする
        body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      });
      if (!res.ok) this.logger.warn(`Discord webhook が ${res.status} を返しました`);
    } catch (err) {
      this.logger.warn(`Discord webhook の送信に失敗: ${String(err)}`);
    }
  }
}
