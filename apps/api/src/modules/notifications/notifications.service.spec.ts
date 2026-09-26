import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DiscordWebhookService } from './discord-webhook.service.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

const organizer = { id: 'organizer', displayName: '主催者' };

function makeEvent(overrides: Partial<Parameters<NotificationsService['eventCreated']>[0]> = {}) {
  return {
    id: 'event-1',
    title: 'テストLT',
    organizer,
    candidateDates: [
      { startsAt: new Date('2026-10-05T09:00:00Z'), responses: [] },
      { startsAt: new Date('2026-10-06T09:00:00Z'), responses: [] },
    ],
    confirmedDate: null,
    webhookUrl: null,
    organization: null,
    ...overrides,
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: { createForRespondents: ReturnType<typeof vi.fn>; createForEventAudience: ReturnType<typeof vi.fn> };
  let discord: { send: ReturnType<typeof vi.fn>; sendOnly: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    repo = {
      createForRespondents: vi.fn().mockResolvedValue(undefined),
      createForEventAudience: vi.fn().mockResolvedValue(undefined),
    };
    discord = { send: vi.fn().mockResolvedValue(undefined), sendOnly: vi.fn().mockResolvedValue(undefined) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DiscordWebhookService, useValue: discord },
        { provide: NotificationsRepository, useValue: repo },
        { provide: ConfigService, useValue: { get: (_k: string, d?: string) => d } },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  it('LT会作成: 主催者を渡して、表示用の値（LT会名・主催者名・候補日数）を保存する', async () => {
    service.eventCreated(makeEvent());

    await vi.waitFor(() => expect(repo.createForEventAudience).toHaveBeenCalled());
    expect(repo.createForEventAudience).toHaveBeenCalledWith('organizer', {
      type: 'EVENT_CREATED',
      eventId: 'event-1',
      data: { eventTitle: 'テストLT', organizerName: '主催者', candidateDateCount: 2 },
    });
  });

  it('開催日決定: 回答したログインユーザーだけに重複なく通知する（ゲスト・主催者は除く）', async () => {
    service.eventConfirmed(
      makeEvent({
        candidateDates: [
          { startsAt: new Date('2026-10-05T09:00:00Z'), responses: [{ userId: 'u1' }, { userId: null }] },
          {
            startsAt: new Date('2026-10-06T09:00:00Z'),
            responses: [{ userId: 'u1' }, { userId: 'organizer' }, { userId: 'u3' }],
          },
        ],
        confirmedDate: { startsAt: new Date('2026-10-06T09:00:00Z') },
      }),
    );

    await vi.waitFor(() => expect(repo.createForRespondents).toHaveBeenCalled());
    expect(repo.createForRespondents).toHaveBeenCalledWith(['u1', 'u3'], 'organizer', {
      type: 'EVENT_CONFIRMED',
      eventId: 'event-1',
      data: { eventTitle: 'テストLT', startsAt: '2026-10-06T09:00:00.000Z' },
    });
  });

  it('Discord: LT会ごとの送り先と、紐付いた団体の送り先の両方に流す', () => {
    const eventUrl = 'https://discord.com/api/webhooks/1/event';
    const orgUrl = 'https://discord.com/api/webhooks/2/org';
    service.eventCreated(makeEvent({ webhookUrl: eventUrl, organization: { webhookUrl: orgUrl } }));
    expect(discord.send).toHaveBeenCalledWith(expect.stringContaining('テストLT'), eventUrl, orgUrl);
  });

  it('Discord: コメントは団体の送り先に流さない（無関係な人でも投稿できるため）', () => {
    const eventUrl = 'https://discord.com/api/webhooks/1/event';
    service.commentPosted({ id: 'event-1', title: 'テストLT', webhookUrl: eventUrl }, '投稿者', 'こんにちは');
    expect(discord.send).toHaveBeenCalledWith(expect.stringContaining('こんにちは'), eventUrl);
  });

  it('Discord: 団体に紐付いたことは、その団体の送り先にだけ知らせる', () => {
    const orgUrl = 'https://discord.com/api/webhooks/2/org';
    service.eventLinkedToOrganization({ ...makeEvent(), organization: { name: '研究室', webhookUrl: orgUrl } });
    expect(discord.sendOnly).toHaveBeenCalledWith(expect.stringContaining('研究室'), orgUrl);
    expect(discord.send).not.toHaveBeenCalled();
  });

  it('Discord: 団体に送り先が無ければ何も送らない', () => {
    service.eventLinkedToOrganization({ ...makeEvent(), organization: { name: '研究室', webhookUrl: null } });
    expect(discord.sendOnly).not.toHaveBeenCalled();
  });

  it('開催日が未設定なら何もしない', () => {
    service.eventConfirmed(makeEvent());
    expect(repo.createForRespondents).not.toHaveBeenCalled();
  });

  it('保存に失敗しても例外を投げない', async () => {
    repo.createForEventAudience.mockRejectedValue(new Error('db down'));
    expect(() => service.eventCreated(makeEvent())).not.toThrow();
    await vi.waitFor(() => expect(repo.createForEventAudience).toHaveBeenCalled());
  });
});
