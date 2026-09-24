import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordWebhookService } from './discord-webhook.service.js';
import { NotificationsRepository, type NewNotification } from './notifications.repository.js';

interface EventForNotification {
  id: string;
  title: string;
  organizer: { id: string; displayName: string };
  candidateDates: { startsAt: Date; responses: { userId: string | null }[] }[];
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
 * 送信手段（Discord / アプリ内通知）は個別のサービス・リポジトリに任せる。
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly webUrl: string;

  constructor(
    private readonly discord: DiscordWebhookService,
    private readonly notifications: NotificationsRepository,
    config: ConfigService,
  ) {
    this.webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  /** LT会が作成された。候補日への回答を促す */
  eventCreated(event: EventForNotification): void {
    const dates = event.candidateDates.map((d) => `・${dateFormat.format(d.startsAt)}`).join('\n');
    const content = [
      `📣 新しいLT会「${event.title}」が作成されました（主催: ${event.organizer.displayName}）`,
      '候補日:',
      dates,
      `参加できる日を回答してください → ${this.eventUrl(event.id)}`,
    ].join('\n');
    void this.discord.send(content, event.webhookUrl);

    // TODO(#8): フォロー機能の実装後はフォロワーのみに絞る。当面は主催者以外の全ユーザー（主催者をブロックした人は除く）
    const data: NewNotification = {
      type: 'EVENT_CREATED',
      title: `新しいLT会「${event.title}」`,
      body: `${event.organizer.displayName} さんがLT会を作成しました。候補日 ${event.candidateDates.length} 件から参加できる日を回答しましょう`,
      link: this.eventPath(event.id),
    };
    this.saveInApp(() => this.notifications.createForEventAudience(event.organizer.id, data));
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

    const data: NewNotification = {
      type: 'EVENT_CONFIRMED',
      title: `「${event.title}」の開催日が決まりました`,
      body: `📅 ${dateFormat.format(event.confirmedDate.startsAt)}`,
      link: this.eventPath(event.id),
    };
    this.saveInApp(() => this.notifications.createForUsers(respondentIds(event), data));
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

  /**
   * アプリ内通知を保存する。Discord と同じく、失敗しても本処理（LT会の作成・決定）は止めずにログに残す。
   */
  private saveInApp(save: () => Promise<void>): void {
    // then の中で呼ぶことで、save 内の同期的な例外も catch に流す
    void Promise.resolve()
      .then(save)
      .catch((err: unknown) => this.logger.warn(`アプリ内通知の保存に失敗: ${String(err)}`));
  }

  private eventUrl(id: string): string {
    return `${this.webUrl}${this.eventPath(id)}`;
  }

  /** アプリ内通知の link は web 内のパスで持つ（ドメインが変わっても使えるように） */
  private eventPath(id: string): string {
    return `/events/${id}`;
  }
}

/** そのLT会の候補日に回答したログインユーザー（ゲスト・主催者本人は除く） */
function respondentIds(event: EventForNotification): string[] {
  const ids = new Set<string>();
  for (const d of event.candidateDates) {
    for (const r of d.responses) {
      if (r.userId && r.userId !== event.organizer.id) ids.add(r.userId);
    }
  }
  return [...ids];
}
