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
    ...overrides,
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: { createForRespondents: ReturnType<typeof vi.fn>; createForEventAudience: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    repo = {
      createForRespondents: vi.fn().mockResolvedValue(undefined),
      createForEventAudience: vi.fn().mockResolvedValue(undefined),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DiscordWebhookService, useValue: { send: vi.fn().mockResolvedValue(undefined) } },
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
