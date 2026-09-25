import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordWebhookService } from './discord-webhook.service.js';

interface EventForNotification {
  id: string;
  title: string;
  organizer: { displayName: string };
  candidateDates: { startsAt: Date }[];
  confirmedDate: { startsAt: Date } | null;
  /** 主催者が設定したLT会ごとの送り先 */
  webhookUrl: string | null;
}

const dateFormat = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * 「誰に・何を」通知するかを決める層。
 * 送信手段（Discord 等）は個別のサービスに任せる。
 */
@Injectable()
export class NotificationsService {
  private readonly webUrl: string;

  constructor(
    private readonly discord: DiscordWebhookService,
    config: ConfigService,
  ) {
    this.webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  /** LT会が作成された。候補日への回答を促す */
  eventCreated(event: EventForNotification): void {
    const dates = event.candidateDates
      .map((d) => `・${dateFormat.format(d.startsAt)}`)
      .join('\n');
    const content = [
      `📣 新しいLT会「${event.title}」が作成されました（主催: ${event.organizer.displayName}）`,
      '候補日:',
      dates,
      `参加できる日を回答してください → ${this.eventUrl(event.id)}`,
    ].join('\n');
    void this.discord.send(content, event.webhookUrl);
  }

  /** 開催日が決定した */
  eventConfirmed(event: EventForNotification): void {
    if (!event.confirmedDate) return;
    const content = [
      `✅ LT会「${event.title}」の開催日が決まりました`,
      `📅 ${dateFormat.format(event.confirmedDate.startsAt)}`,
      this.eventUrl(event.id),
    ].join('\n');
    void this.discord.send(content, event.webhookUrl);
  }

  /** LT会にコメントが付いた */
  commentPosted(
    event: Pick<EventForNotification, 'id' | 'title' | 'webhookUrl'>,
    authorName: string,
    body: string,
  ): void {
    // 長文をそのまま流すとチャンネルが埋まるので先頭だけ
    const excerpt = body.length > 100 ? `${body.slice(0, 100)}…` : body;
    const content = [
      `💬 LT会「${event.title}」に ${authorName} さんがコメントしました`,
      excerpt,
      this.eventUrl(event.id),
    ].join('\n');
    void this.discord.send(content, event.webhookUrl);
  }

  private eventUrl(id: string): string {
    return `${this.webUrl}/events/${id}`;
  }
}
