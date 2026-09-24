import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ResponsesService } from './responses.service.js';
import { ResponsesRepository } from './responses.repository.js';
import { EventsService } from '../events/events.service.js';
import { buildEvent, buildUser } from '../../test-support/event-factories.js';
import type { SubmitResponsesDto } from './dto/submit-responses.dto.js';
import type { SubmitGuestResponsesDto } from './dto/submit-guest-responses.dto.js';

describe('ResponsesService', () => {
  let service: ResponsesService;
  let repo: { upsertForUser: ReturnType<typeof vi.fn>; upsertForGuest: ReturnType<typeof vi.fn> };
  let events: {
    findOrThrow: ReturnType<typeof vi.fn>;
    findVisibleOrThrow: ReturnType<typeof vi.fn>;
    getDetail: ReturnType<typeof vi.fn>;
  };

  const user = buildUser();

  beforeEach(async () => {
    repo = { upsertForUser: vi.fn(), upsertForGuest: vi.fn() };
    events = { findOrThrow: vi.fn(), findVisibleOrThrow: vi.fn(), getDetail: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsesService,
        { provide: ResponsesRepository, useValue: repo },
        { provide: EventsService, useValue: events },
      ],
    }).compile();

    service = module.get(ResponsesService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('submitForUser', () => {
    it('CLOSED のLT会への回答は 400（締め切り後の回答拒否）', async () => {
      events.findVisibleOrThrow.mockResolvedValue(buildEvent({ status: 'CLOSED' }));
      const dto: SubmitResponsesDto = { responses: [{ eventDateId: 'date-1', availability: 'YES' }] };

      await expect(service.submitForUser('event-1', user, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForUser).not.toHaveBeenCalled();
    });

    it('CONFIRMED のLT会への回答は 400（締め切り後の回答拒否）', async () => {
      events.findVisibleOrThrow.mockResolvedValue(buildEvent({ status: 'CONFIRMED' }));
      const dto: SubmitResponsesDto = { responses: [{ eventDateId: 'date-1', availability: 'YES' }] };

      await expect(service.submitForUser('event-1', user, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForUser).not.toHaveBeenCalled();
    });

    it('このLT会の候補日でなければ 400', async () => {
      events.findVisibleOrThrow.mockResolvedValue(buildEvent({ status: 'OPEN' }));
      const dto: SubmitResponsesDto = { responses: [{ eventDateId: 'other-event-date', availability: 'YES' }] };

      await expect(service.submitForUser('event-1', user, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForUser).not.toHaveBeenCalled();
    });

    it('同じ候補日への回答が重複していると 400', async () => {
      events.findVisibleOrThrow.mockResolvedValue(buildEvent({ status: 'OPEN' }));
      const dto: SubmitResponsesDto = {
        responses: [
          { eventDateId: 'date-1', availability: 'YES' },
          { eventDateId: 'date-1', availability: 'NO' },
        ],
      };

      await expect(service.submitForUser('event-1', user, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForUser).not.toHaveBeenCalled();
    });

    it('OPEN のLT会なら回答を upsert して最新の詳細を返す', async () => {
      events.findVisibleOrThrow.mockResolvedValue(buildEvent({ status: 'OPEN' }));
      repo.upsertForUser.mockResolvedValue(undefined);
      const detail = { id: 'event-1' };
      events.getDetail.mockResolvedValue(detail);
      const dto: SubmitResponsesDto = {
        responses: [
          { eventDateId: 'date-1', availability: 'YES' },
          { eventDateId: 'date-2', availability: 'MAYBE', comment: 'たぶん行けます' },
        ],
      };

      const result = await service.submitForUser('event-1', user, dto);

      expect(repo.upsertForUser).toHaveBeenCalledWith(user.id, [
        { eventDateId: 'date-1', availability: 'YES', comment: null },
        { eventDateId: 'date-2', availability: 'MAYBE', comment: 'たぶん行けます' },
      ]);
      expect(events.getDetail).toHaveBeenCalledWith('event-1', user);
      expect(result).toBe(detail);
    });
  });

  describe('submitForGuest', () => {
    it('CLOSED のLT会への回答は 400', async () => {
      const event = buildEvent({ status: 'CLOSED' });
      const dto: SubmitGuestResponsesDto = {
        guestKey: 'guest-key-1',
        guestName: 'ゲスト',
        responses: [{ eventDateId: 'date-1', availability: 'YES' }],
      };

      await expect(service.submitForGuest(event, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForGuest).not.toHaveBeenCalled();
    });

    it('このLT会の候補日でなければ 400', async () => {
      const event = buildEvent({ status: 'OPEN' });
      const dto: SubmitGuestResponsesDto = {
        guestKey: 'guest-key-1',
        guestName: 'ゲスト',
        responses: [{ eventDateId: 'other-event-date', availability: 'YES' }],
      };

      await expect(service.submitForGuest(event, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForGuest).not.toHaveBeenCalled();
    });

    it('同じ候補日への回答が重複していると 400', async () => {
      const event = buildEvent({ status: 'OPEN' });
      const dto: SubmitGuestResponsesDto = {
        guestKey: 'guest-key-1',
        guestName: 'ゲスト',
        responses: [
          { eventDateId: 'date-1', availability: 'YES' },
          { eventDateId: 'date-1', availability: 'MAYBE' },
        ],
      };

      await expect(service.submitForGuest(event, dto)).rejects.toThrow(BadRequestException);
      expect(repo.upsertForGuest).not.toHaveBeenCalled();
    });

    it('OPEN のLT会ならゲスト名を trim して upsert し、最新の詳細を返す', async () => {
      const event = buildEvent({ status: 'OPEN' });
      const updated = buildEvent({ status: 'OPEN' });
      repo.upsertForGuest.mockResolvedValue(undefined);
      events.findOrThrow.mockResolvedValue(updated);
      const dto: SubmitGuestResponsesDto = {
        guestKey: 'guest-key-1',
        guestName: '  ゲスト太郎  ',
        responses: [{ eventDateId: 'date-1', availability: 'NO' }],
      };

      const result = await service.submitForGuest(event, dto);

      expect(repo.upsertForGuest).toHaveBeenCalledWith('guest-key-1', 'ゲスト太郎', [
        { eventDateId: 'date-1', availability: 'NO', comment: null },
      ]);
      expect(events.findOrThrow).toHaveBeenCalledWith(event.id);
      // ゲストは shareToken/viewer を持たない (viewerId = null) の詳細が返る
      expect(result.id).toBe(updated.id);
      expect(result.shareToken).toBeNull();
    });
  });
});
