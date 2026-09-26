import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntriesService } from './entries.service.js';
import { EntriesRepository } from './entries.repository.js';
import { EventsService } from '../events/events.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { buildEntry, buildEvent, buildUser } from '../../test-support/event-factories.js';

describe('EntriesService', () => {
  let service: EntriesService;
  let repo: { findRole: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let events: { findVisibleAccessInfoOrThrow: ReturnType<typeof vi.fn> };
  let notifications: { speakerEntered: ReturnType<typeof vi.fn> };

  // 主催者は user-1（buildEvent の既定）。参加表明するのは別のユーザー
  const speaker = buildUser({ id: 'user-2', handle: 'speaker', displayName: '登壇者' });

  beforeEach(async () => {
    repo = { findRole: vi.fn().mockResolvedValue(null), upsert: vi.fn(), delete: vi.fn() };
    events = { findVisibleAccessInfoOrThrow: vi.fn().mockResolvedValue(buildEvent()) };
    notifications = { speakerEntered: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        { provide: EntriesRepository, useValue: repo },
        { provide: EventsService, useValue: events },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(EntriesService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('submit', () => {
    it('登壇の表明を保存し、主催者に通知する', async () => {
      repo.upsert.mockResolvedValue(buildEntry());

      const result = await service.submit('event-1', speaker, {
        role: 'SPEAKER',
        talkTitle: '  発表タイトル  ',
        talkDetail: '  ',
        durationMinutes: 5,
      });

      expect(repo.upsert).toHaveBeenCalledWith('event-1', 'user-2', {
        role: 'SPEAKER',
        talkTitle: '発表タイトル',
        talkDetail: null,
        durationMinutes: 5,
      });
      expect(notifications.speakerEntered).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'event-1' }),
        expect.objectContaining({ id: 'user-2', displayName: '登壇者' }),
        '発表タイトル',
      );
      // 本人には発表内容の説明と時間も返す
      expect(result).toMatchObject({ role: 'SPEAKER', talkDetail: '発表内容の説明', durationMinutes: 5 });
    });

    it('登壇なのに発表タイトルが空なら 400', async () => {
      await expect(service.submit('event-1', speaker, { role: 'SPEAKER', talkTitle: '   ' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('聴講なら発表に関する項目は捨てて保存し、通知しない', async () => {
      repo.upsert.mockResolvedValue(buildEntry({ role: 'AUDIENCE', talkTitle: null, talkDetail: null }));

      await service.submit('event-1', speaker, { role: 'AUDIENCE', talkTitle: 'x', durationMinutes: 10 });

      expect(repo.upsert).toHaveBeenCalledWith('event-1', 'user-2', {
        role: 'AUDIENCE',
        talkTitle: null,
        talkDetail: null,
        durationMinutes: null,
      });
      expect(notifications.speakerEntered).not.toHaveBeenCalled();
    });

    it('すでに登壇で表明済みなら、内容を更新しても通知を重ねない', async () => {
      repo.findRole.mockResolvedValue('SPEAKER');
      repo.upsert.mockResolvedValue(buildEntry({ talkTitle: '新しいタイトル' }));

      await service.submit('event-1', speaker, { role: 'SPEAKER', talkTitle: '新しいタイトル' });

      expect(notifications.speakerEntered).not.toHaveBeenCalled();
    });

    it('聴講から登壇に変えたら通知する', async () => {
      repo.findRole.mockResolvedValue('AUDIENCE');
      repo.upsert.mockResolvedValue(buildEntry());

      await service.submit('event-1', speaker, { role: 'SPEAKER', talkTitle: '発表タイトル' });

      expect(notifications.speakerEntered).toHaveBeenCalledTimes(1);
    });

    it('主催者は表明できない（400）', async () => {
      const organizer = buildUser();

      await expect(service.submit('event-1', organizer, { role: 'SPEAKER', talkTitle: '主催者LT' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.upsert).not.toHaveBeenCalled();
      expect(notifications.speakerEntered).not.toHaveBeenCalled();
    });

    it('終了したLT会には表明できない（400）', async () => {
      events.findVisibleAccessInfoOrThrow.mockResolvedValue(buildEvent({ status: 'CLOSED' }));

      await expect(service.submit('event-1', speaker, { role: 'AUDIENCE' })).rejects.toThrow(BadRequestException);
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('開催日が決まった後でも表明できる', async () => {
      events.findVisibleAccessInfoOrThrow.mockResolvedValue(buildEvent({ status: 'CONFIRMED' }));
      repo.upsert.mockResolvedValue(buildEntry({ role: 'AUDIENCE' }));

      await expect(service.submit('event-1', speaker, { role: 'AUDIENCE' })).resolves.toBeDefined();
    });
  });

  describe('remove', () => {
    it('自分の表明を削除する', async () => {
      repo.delete.mockResolvedValue(1);

      await service.remove('event-1', speaker);

      expect(repo.delete).toHaveBeenCalledWith('event-1', 'user-2');
    });

    it('表明していなければ 404', async () => {
      repo.delete.mockResolvedValue(0);

      await expect(service.remove('event-1', speaker)).rejects.toThrow(NotFoundException);
    });
  });
});
