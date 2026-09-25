import type { PrismaService } from '../../prisma/prisma.service.js';
import {
  NotificationsRepository,
  decodeNotificationCursor,
  encodeNotificationCursor,
  type NewNotification,
} from './notifications.repository.js';

const NOW = new Date('2026-10-01T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ORGANIZER = 'organizer';

const created: NewNotification = {
  type: 'EVENT_CREATED',
  eventId: 'event-1',
  data: { eventTitle: 't', organizerName: 'o', candidateDateCount: 1 },
};
const confirmed: NewNotification = {
  type: 'EVENT_CONFIRMED',
  eventId: 'event-1',
  data: { eventTitle: 't', startsAt: '2026-10-05T09:00:00.000Z' },
};

const ids = (n: number, prefix = 'u') => Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(5, '0')}`);

interface FakeUser {
  id: string;
}

/**
 * Prisma の user.findMany を配列で再現する。リポジトリが使う where の条件を実際に評価し、
 * 知らない条件が来たら例外にする（条件を書き換えたのにテストが素通りするのを防ぐ）
 */
function setup(users: FakeUser[], blocks: { blockerId: string; blockedId: string }[] = []) {
  const createMany = vi.fn().mockResolvedValue({ count: 0 });

  const matches = (u: FakeUser, where: Record<string, unknown>): boolean =>
    Object.entries(where).every(([key, cond]) => {
      const c = cond as Record<string, any>;
      switch (key) {
        case 'AND':
          return (cond as Record<string, unknown>[]).every((w) => matches(u, w));
        case 'id':
          return (
            (c.not === undefined || u.id !== c.not) &&
            (c.gt === undefined || u.id > c.gt) &&
            (c.in === undefined || c.in.includes(u.id))
          );
        case 'blocking': // u がブロックした相手
          return !blocks.some((b) => b.blockerId === u.id && b.blockedId === c.none.blockedId);
        case 'blockedBy': // u をブロックした相手
          return !blocks.some((b) => b.blockedId === u.id && b.blockerId === c.none.blockerId);
        default:
          throw new Error(`テストのスタブが知らない条件です: ${key}`);
      }
    });

  const findMany = vi.fn(({ where, take }: { where: Record<string, unknown>; take?: number }) => {
    const hit = users
      .filter((u) => matches(u, where))
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .slice(0, take ?? Infinity);
    return Promise.resolve(hit.map((u) => ({ id: u.id })));
  });

  const prisma = { notification: { createMany }, user: { findMany } } as unknown as PrismaService;
  const createdFor = () =>
    createMany.mock.calls.flatMap(([arg]) => arg.data.map((d: { userId: string }) => d.userId)) as string[];
  return { repo: new NotificationsRepository(prisma), createMany, findMany, createdFor };
}

const user = (id: string): FakeUser => ({ id });

describe('NotificationsRepository', () => {
  describe('createForEventAudience（新しいLT会）', () => {
    it('全ユーザーに、1000件ずつ区切って漏れなく重複なく作る（主催者本人は除く）', async () => {
      const { repo, createMany, createdFor } = setup([...ids(2000).map(user), user(ORGANIZER)]);
      await repo.createForEventAudience(ORGANIZER, created);

      expect(createdFor()).toHaveLength(2000);
      expect(new Set(createdFor()).size).toBe(2000);
      expect(createdFor()).not.toContain(ORGANIZER);
      expect(Math.max(...createMany.mock.calls.map(([arg]) => arg.data.length))).toBeLessThanOrEqual(1000);
    });

    it('ちょうど1000人でも無限ループしない', async () => {
      const { repo, findMany } = setup(ids(1000).map(user));
      await repo.createForEventAudience(ORGANIZER, created);
      expect(findMany).toHaveBeenCalledTimes(2);
    });

    it('主催者をブロックしている人には作らない（主催者がブロックした相手には作る）', async () => {
      const { repo, createdFor } = setup(
        [user('blocker'), user('blocked-by-organizer'), user('other')],
        [
          { blockerId: 'blocker', blockedId: ORGANIZER },
          { blockerId: ORGANIZER, blockedId: 'blocked-by-organizer' },
        ],
      );
      await repo.createForEventAudience(ORGANIZER, created);
      expect(createdFor()).toEqual(['blocked-by-organizer', 'other']);
    });
  });

  describe('createForRespondents（開催日決定）', () => {
    it('主催者をブロックしている回答者には作らない（主催者がブロックした相手には作る）', async () => {
      const { repo, createdFor } = setup(
        [{ id: 'blocker' }, { id: 'blocked-by-organizer' }, { id: 'other' }],
        [
          { blockerId: 'blocker', blockedId: ORGANIZER },
          { blockerId: ORGANIZER, blockedId: 'blocked-by-organizer' },
        ],
      );
      await repo.createForRespondents(['blocker', 'blocked-by-organizer', 'other'], ORGANIZER, confirmed);
      expect(createdFor()).toEqual(['blocked-by-organizer', 'other']);
    });

    it('回答者が多くても1000件ずつに区切る', async () => {
      const users = ids(2500).map((id) => ({ id }));
      const { repo, createMany, createdFor } = setup(users);
      await repo.createForRespondents(
        users.map((u) => u.id),
        ORGANIZER,
        confirmed,
      );
      expect(createMany.mock.calls.map(([arg]) => arg.data.length)).toEqual([1000, 1000, 500]);
      expect(createdFor()).toHaveLength(2500);
    });

    it('宛先が0人なら INSERT しない', async () => {
      const { repo, createMany } = setup([]);
      await repo.createForRespondents([], ORGANIZER, confirmed);
      expect(createMany).not.toHaveBeenCalled();
    });

    it('type・eventId・data をそのまま保存する', async () => {
      const { repo, createMany } = setup([{ id: 'u1' }]);
      await repo.createForRespondents(['u1'], ORGANIZER, confirmed);
      expect(createMany.mock.calls[0][0].data).toEqual([
        { userId: 'u1', type: 'EVENT_CONFIRMED', eventId: 'event-1', data: confirmed.data },
      ]);
    });
  });

  describe('deleteReadBefore（古い通知の削除）', () => {
    function setupRows(rows: { id: string; readAt: Date | null }[]) {
      let table = [...rows];
      const findMany = vi.fn(({ where, take }: { where: { readAt: { lt: Date } }; take: number }) =>
        Promise.resolve(
          table
            .filter((r) => r.readAt !== null && r.readAt < where.readAt.lt)
            .slice(0, take)
            .map((r) => ({ id: r.id })),
        ),
      );
      const deleteMany = vi.fn(({ where }: { where: { id: { in: string[] } } }) => {
        const before = table.length;
        table = table.filter((r) => !where.id.in.includes(r.id));
        return Promise.resolve({ count: before - table.length });
      });
      const prisma = { notification: { findMany, deleteMany } } as unknown as PrismaService;
      return { repo: new NotificationsRepository(prisma), remaining: () => table.map((r) => r.id), deleteMany };
    }

    it('既読にした日時が基準より前のものだけを消し、未読は残す', async () => {
      const { repo, remaining } = setupRows([
        { id: 'old-read', readAt: new Date(NOW.getTime() - 100 * DAY) },
        { id: 'new-read', readAt: new Date(NOW.getTime() - DAY) },
        { id: 'unread', readAt: null },
      ]);
      const count = await repo.deleteReadBefore(new Date(NOW.getTime() - 90 * DAY));
      expect(count).toBe(1);
      expect(remaining()).toEqual(['new-read', 'unread']);
    });

    it('大量にあっても1000件ずつ消して、全部消し切る', async () => {
      const old = new Date(NOW.getTime() - 100 * DAY);
      const { repo, remaining, deleteMany } = setupRows(ids(2500).map((id) => ({ id, readAt: old })));
      const count = await repo.deleteReadBefore(NOW);
      expect(count).toBe(2500);
      expect(remaining()).toEqual([]);
      expect(deleteMany.mock.calls.map(([arg]) => arg.where.id.in.length)).toEqual([1000, 1000, 500]);
    });
  });

  describe('cursor', () => {
    it('encode したものを decode すると元に戻る', () => {
      const c = { createdAt: new Date('2026-10-01T01:02:03.456Z'), id: 'abc' };
      expect(decodeNotificationCursor(encodeNotificationCursor(c))).toEqual(c);
    });

    it('壊れた cursor は null', () => {
      expect(decodeNotificationCursor('abc')).toBeNull();
      expect(decodeNotificationCursor(Buffer.from('not-a-date|id').toString('base64url'))).toBeNull();
    });
  });
});
