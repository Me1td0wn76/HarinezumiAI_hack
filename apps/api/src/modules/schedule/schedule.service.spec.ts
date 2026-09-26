import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ScheduleService } from './schedule.service.js';
import { ScheduleRepository } from './schedule.repository.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { buildUser } from '../../test-support/event-factories.js';

describe('ScheduleService.publicBetween', () => {
  let service: ScheduleService;
  let repo: { findPublicBetween: ReturnType<typeof vi.fn> };
  let blocks: { findBlockedIds: ReturnType<typeof vi.fn> };

  const organizer = { id: 'user-1', handle: 'organizer', displayName: '主催者', avatarUrl: null };
  const date = (id: string, iso: string) => ({ id, eventId: 'event-1', startsAt: new Date(iso), endsAt: null });

  beforeEach(async () => {
    repo = { findPublicBetween: vi.fn().mockResolvedValue([]) };
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
    expect(repo.findPublicBetween).not.toHaveBeenCalled();
  });

  it('ログインしていればブロックした相手を除いて検索する', async () => {
    await service.publicBetween({ from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' }, buildUser());
    expect(repo.findPublicBetween).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), ['blocked-user']);
  });

  it('決定済みは開催日だけ、調整中は候補日ごとに、開始日時の昇順で返す', async () => {
    repo.findPublicBetween.mockResolvedValue([
      {
        id: 'event-1',
        title: '決定済み',
        status: 'CONFIRMED',
        format: 'ONLINE',
        organizer,
        confirmedDateId: 'd-2',
        candidateDates: [date('d-1', '2026-10-03T10:00:00Z'), date('d-2', '2026-10-20T10:00:00Z')],
      },
      {
        id: 'event-2',
        title: '調整中',
        status: 'OPEN',
        format: 'OFFLINE',
        organizer,
        confirmedDateId: null,
        candidateDates: [date('d-3', '2026-10-05T10:00:00Z'), date('d-4', '2026-10-25T10:00:00Z')],
      },
    ]);

    const items = await service.publicBetween({ from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' }, null);

    expect(items.map((i) => [i.eventDateId, i.confirmed])).toEqual([
      ['d-3', false],
      ['d-2', true],
      ['d-4', false],
    ]);
    expect(blocks.findBlockedIds).not.toHaveBeenCalled();
  });
});
