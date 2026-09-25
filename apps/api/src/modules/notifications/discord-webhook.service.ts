import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 主催者が登録できる Discord Webhook URL の形式。
 * サーバーから任意の URL に POST すると SSRF（内部ネットワークへのリクエスト）に使われるため、Discord のホストに限る
 */
export const DISCORD_WEBHOOK_URL_PATTERN =
  /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;

/**
 * Discord の Incoming Webhook にメッセージを投げる。
 * 送り先は、運営が環境変数 DISCORD_WEBHOOK_URL で設定する全体向けの1本と、主催者がLT会ごとに設定する URL。
 * どちらも無ければ何もしない。通知の失敗で本処理を止めないよう、例外は投げずにログに残す。
 */
@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);
  private readonly url: string | undefined;

  constructor(config: ConfigService) {
    this.url = config.get<string>('DISCORD_WEBHOOK_URL') || undefined;
    if (!this.url) this.logger.log('DISCORD_WEBHOOK_URL 未設定のため全体向けの Discord 通知は無効');
  }

  get enabled(): boolean {
    return this.url !== undefined;
  }

  /**
   * @param eventWebhookUrl LT会ごとの送り先。全体向けと同じ URL なら二重に送らない
   */
  async send(content: string, eventWebhookUrl?: string | null): Promise<void> {
    const urls = new Set([this.url, eventWebhookUrl ?? undefined].filter((u): u is string => !!u));
    await Promise.all([...urls].map((url) => this.post(url, content)));
  }

  private async post(url: string, content: string): Promise<void> {
    // DB に入っている値も念のため確認する（DTO の検証をすり抜けた値に POST しない）
    if (url !== this.url && !DISCORD_WEBHOOK_URL_PATTERN.test(url)) {
      this.logger.warn('Discord Webhook の形式ではない URL への送信をスキップしました');
      return;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 本文にユーザー入力（タイトル・コメント）が入るので、@everyone / @here / ロールなどのメンションは無効にする
        body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
        // 検証済みの Discord の URL から、リダイレクトで別のホストへ送られないようにする
        redirect: 'error',
      });
      if (!res.ok)
        this.logger.warn(`Discord webhook が ${res.status} を返しました`);
    } catch (err) {
      this.logger.warn(`Discord webhook の送信に失敗: ${String(err)}`);
    }
  }
}
