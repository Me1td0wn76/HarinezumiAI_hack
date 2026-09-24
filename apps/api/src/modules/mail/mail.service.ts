import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

/**
 * メール送信。RESEND_API_KEY と MAIL_FROM があれば Resend（https://resend.com）の HTTP API で送り、
 * 無ければ送らずにログへ出す（ローカル開発でリセット用リンクを確認できるように。NODE_ENV=production では本文を出さない）。
 * 送信手段を変えるときはこのクラスだけを差し替える。
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string | undefined;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY') || undefined;
    this.from = config.get<string>('MAIL_FROM') || undefined;
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
    if (!this.apiKey || !this.from) this.logger.log('RESEND_API_KEY / MAIL_FROM 未設定のためメールはログに出力します');
  }

  async send(mail: Mail): Promise<void> {
    if (!this.apiKey || !this.from) {
      // 本番では本文（再設定リンク = 有効なトークン）をログに残さない
      const body = this.isProduction ? '（本番環境のため本文は省略）' : mail.text;
      this.logger.warn(`[メール未送信] to=${mail.to} subject=${mail.subject}\n${body}`);
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [mail.to], subject: mail.subject, text: mail.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) this.logger.warn(`メール送信に失敗しました（Resend が ${res.status} を返しました）`);
  }
}
