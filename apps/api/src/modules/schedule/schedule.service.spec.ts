import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PUBLIC_SCHEDULE_ITEM_LIMIT } from '@lt/shared';
import { ScheduleService } from './schedule.service.js';
import { ScheduleRepository } from './schedule.repository.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { buildUser } from '../../test-support/event-factories.js';

describe('ScheduleService.publicBetween', () => {
  let service: ScheduleService;
  let repo: { findPublicDatesBetween: ReturnType<typeof vi.fn> };
  let blocks: { findBlockedIds: ReturnType<typeof vi.fn> };

  const organizer = { id: 'user-1', handle: 'organizer', displayName: '主催者', avatarUrl: null };
  /** リポジトリが返す1件（event_dates の行 + LT会の必要な列） */
  const row = (
    id: string,
    iso: string,
    event: { id: string; status: 'OPEN' | 'CONFIRMED'; confirmedDateId: string | null },
  ) => ({
    id,
    eventId: event.id,
    startsAt: new Date(iso),
    endsAt: null,
    event: { ...event, title: event.id, format: 'ONLINE' as const, organizer },
  });
  const range = { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' };

  beforeEach(async () => {
    repo = { findPublicDatesBetween: vi.fn().mockResolvedValue([]) };
    blocks = { findBlockedIds: vi.fn().mockResolvedValue(['blocked-user']) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: ScheduleRepository, useValue: repo },
        { provide: BlocksRepository, useValue: blocks },
      ],
    }).compile();

    service = module.get(ScheduleService);
  });

  it('to が from 以前なら 400', async () => {
    await expect(
      service.publicBetween({ from: '2026-10-01T00:00:00Z', to: '2026-10-01T00:00:00Z' }, null),
    ).rejects.toThrow(BadRequestException);
  });

  it('期間が長すぎると 400', async () => {
    await expect(
      service.publicBetween({ from: '2026-01-01T00:00:00Z', to: '2026-06-01T00:00:00Z' }, null),
    ).rejects.toThrow(BadRequestException);
    expect(repo.findPublicDatesBetween).not.toHaveBeenCalled();
  });

  it('ログインしていればブロックした相手を除き、打ち切りの判定用に上限 + 1 件を取る', async () => {
    await service.publicBetween(range, buildUser());
    expect(repo.findPublicDatesBetween).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      PUBLIC_SCHEDULE_ITEM_LIMIT + 1,
      ['blocked-user'],
    );
  });

  it('リポジトリの並び（開始日時の昇順）のまま返し、開催日かどうかを付ける', async () => {
    const confirmed = { id: 'event-1', status: 'CONFIRMED' as const, confirmedDateId: 'd-2' };
    const open = { id: 'event-2', status: 'OPEN' as const, confirmedDateId: null };
    repo.findPublicDatesBetween.mockResolvedValue([
      row('d-3', '2026-10-05T10:00:00Z', open),
      row('d-2', '2026-10-20T10:00:00Z', confirmed),
    ]);

    const result = await service.publicBetween(range, null);

    expect(result.items.map((i) => [i.eventDateId, i.eventId, i.confirmed])).toEqual([
      ['d-3', 'event-2', false],
      ['d-2', 'event-1', true],
    ]);
    expect(result.truncated).toBe(false);
    expect(blocks.findBlockedIds).not.toHaveBeenCalled();
  });

  it('上限を超えたら上限まで返して truncated を立てる', async () => {
    const open = { id: 'event-2', status: 'OPEN' as const, confirmedDateId: null };
    repo.findPublicDatesBetween.mockResolvedValue(
      Array.from({ length: PUBLIC_SCHEDULE_ITEM_LIMIT + 1 }, (_, i) => row(`d-${i}`, '2026-10-05T10:00:00Z', open)),
    );

    const result = await service.publicBetween(range, null);

    expect(result.items).toHaveLength(PUBLIC_SCHEDULE_ITEM_LIMIT);
    expect(result.truncated).toBe(true);
  });
});
