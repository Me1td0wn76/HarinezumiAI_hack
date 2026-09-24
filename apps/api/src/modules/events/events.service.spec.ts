import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { EventsRepository } from './events.repository.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { buildEvent, buildUser } from '../../test-support/event-factories.js';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { UpdateEventDto } from './dto/update-event.dto.js';
import type { AddDatesDto } from './dto/add-dates.dto.js';
import type { ConfirmEventDto } from './dto/confirm-event.dto.js';

describe('EventsService', () => {
  let service: EventsService;
  let repo: {
    findManyForList: ReturnType<typeof vi.fn>;
    findDetailById: ReturnType<typeof vi.fn>;
    findDetailByShareToken: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    addDates: ReturnType<typeof vi.fn>;
    findDate: ReturnType<typeof vi.fn>;
    deleteDate: ReturnType<typeof vi.fn>;
    confirm: ReturnType<typeof vi.fn>;
  };
  let notifications: { eventCreated: ReturnType<typeof vi.fn>; eventConfirmed: ReturnType<typeof vi.fn> };

  const organizer = buildUser({ id: 'user-1' });
  const stranger = buildUser({ id: 'user-2', email: 'stranger@example.com' });

  beforeEach(async () => {
    repo = {
      findManyForList: vi.fn(),
      findDetailById: vi.fn(),
      findDetailByShareToken: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      addDates: vi.fn(),
      findDate: vi.fn(),
      deleteDate: vi.fn(),
      confirm: vi.fn(),
    };
    notifications = { eventCreated: vi.fn(), eventConfirmed: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: repo },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('候補日を作成して Discord 通知を送る', async () => {
      const event = buildEvent();
      repo.create.mockResolvedValue(event);
      const dto: CreateEventDto = {
        title: event.title,
        description: event.description,
        candidateDates: [{ startsAt: '2026-02-01T10:00:00.000Z' }],
      };

      const result = await service.create(organizer, dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: dto.title, organizerId: organizer.id }),
      );
      expect(notifications.eventCreated).toHaveBeenCalledWith(event);
      // 作成した本人が viewer なので shareToken を含む
      expect(result.shareToken).toBe(event.shareToken);
    });

    it('終了日時が開始日時以前だと 400', async () => {
      const dto: CreateEventDto = {
        title: 'タイトル',
        description: '説明',
        candidateDates: [{ startsAt: '2026-02-01T10:00:00.000Z', endsAt: '2026-02-01T09:00:00.000Z' }],
      };

      await expect(service.create(organizer, dto)).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('終了日時が開始日時と同じ（境界値）だと 400', async () => {
      const dto: CreateEventDto = {
        title: 'タイトル',
        description: '説明',
        candidateDates: [{ startsAt: '2026-02-01T10:00:00.000Z', endsAt: '2026-02-01T10:00:00.000Z' }],
      };

      await expect(service.create(organizer, dto)).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('主催者以外が更新しようとすると 403', async () => {
      repo.findDetailById.mockResolvedValue(buildEvent({ organizerId: organizer.id }));
      const dto: UpdateEventDto = { title: '新タイトル' };

      await expect(service.update('event-1', stranger, dto)).rejects.toThrow(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('主催者本人なら更新できる', async () => {
      const event = buildEvent({ organizerId: organizer.id });
      repo.findDetailById.mockResolvedValue(event);
      repo.update.mockResolvedValue({ ...event, title: '新タイトル' });
      const dto: UpdateEventDto = { title: '新タイトル' };

      const result = await service.update('event-1', organizer, dto);

      expect(repo.update).toHaveBeenCalledWith('event-1', { title: '新タイトル', description: undefined });
      expect(result.title).toBe('新タイトル');
    });

    it('LT会が存在しないと 404', async () => {
      repo.findDetailById.mockResolvedValue(null);

      await expect(service.update('missing', organizer, { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('主催者以外が削除しようとすると 403', async () => {
      repo.findDetailById.mockResolvedValue(buildEvent({ organizerId: organizer.id }));

      await expect(service.remove('event-1', stranger)).rejects.toThrow(ForbiddenException);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('addDates', () => {
    it('OPEN でないLT会には追加できない（400）', async () => {
      repo.findDetailById.mockResolvedValue(buildEvent({ organizerId: organizer.id, status: 'CONFIRMED' }));
      const dto: AddDatesDto = { candidateDates: [{ startsAt: '2026-03-01T10:00:00.000Z' }] };

      await expect(service.addDates('event-1', organizer, dto)).rejects.toThrow(BadRequestException);
      expect(repo.addDates).not.toHaveBeenCalled();
    });

    it('OPEN なら候補日を追加できる', async () => {
      const event = buildEvent({ organizerId: organizer.id, status: 'OPEN' });
      repo.findDetailById.mockResolvedValue(event);
      repo.addDates.mockResolvedValue(undefined);
      const dto: AddDatesDto = { candidateDates: [{ startsAt: '2026-03-01T10:00:00.000Z' }] };

      await service.addDates('event-1', organizer, dto);

      expect(repo.addDates).toHaveBeenCalledWith('event-1', [{ startsAt: new Date('2026-03-01T10:00:00.000Z'), endsAt: null }]);
    });
  });

  describe('removeDate', () => {
    it('このLT会の候補日でなければ 404', async () => {
      repo.findDetailById.mockResolvedValue(buildEvent({ organizerId: organizer.id }));

      await expect(service.removeDate('event-1', 'unknown-date', organizer)).rejects.toThrow(NotFoundException);
      expect(repo.deleteDate).not.toHaveBeenCalled();
    });

    it('決定済みの候補日は削除できない（400）', async () => {
      const event = buildEvent({ organizerId: organizer.id, confirmedDateId: 'date-1' });
      repo.findDetailById.mockResolvedValue(event);

      await expect(service.removeDate('event-1', 'date-1', organizer)).rejects.toThrow(BadRequestException);
      expect(repo.deleteDate).not.toHaveBeenCalled();
    });

    it('未決定の候補日は削除できる', async () => {
      const event = buildEvent({ organizerId: organizer.id, confirmedDateId: null });
      repo.findDetailById.mockResolvedValue(event);
      repo.deleteDate.mockResolvedValue(undefined);

      await service.removeDate('event-1', 'date-1', organizer);

      expect(repo.deleteDate).toHaveBeenCalledWith('date-1');
    });
  });

  describe('confirm', () => {
    it('このLT会の候補日でなければ 404', async () => {
      repo.findDetailById.mockResolvedValue(buildEvent({ organizerId: organizer.id }));
      const dto: ConfirmEventDto = { eventDateId: 'unknown-date' };

      await expect(service.confirm('event-1', organizer, dto)).rejects.toThrow(NotFoundException);
      expect(repo.confirm).not.toHaveBeenCalled();
    });

    it('候補日を決定して Discord 通知を送る', async () => {
      const event = buildEvent({ organizerId: organizer.id });
      const confirmed = buildEvent({
        organizerId: organizer.id,
        status: 'CONFIRMED',
        confirmedDateId: 'date-1',
        confirmedDate: event.candidateDates[0],
      });
      repo.findDetailById.mockResolvedValue(event);
      repo.confirm.mockResolvedValue(confirmed);
      const dto: ConfirmEventDto = { eventDateId: 'date-1' };

      const result = await service.confirm('event-1', organizer, dto);

      expect(repo.confirm).toHaveBeenCalledWith('event-1', 'date-1');
      expect(notifications.eventConfirmed).toHaveBeenCalledWith(confirmed);
      expect(result.status).toBe('CONFIRMED');
    });

    it('主催者以外が決定しようとすると 403', async () => {
      repo.findDetailById.mockResolvedValue(buildEvent({ organizerId: organizer.id }));
      const dto: ConfirmEventDto = { eventDateId: 'date-1' };

      await expect(service.confirm('event-1', stranger, dto)).rejects.toThrow(ForbiddenException);
      expect(repo.confirm).not.toHaveBeenCalled();
    });
  });

  describe('findOrThrow', () => {
    it('存在しないLT会は 404', async () => {
      repo.findDetailById.mockResolvedValue(null);

      await expect(service.findOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
