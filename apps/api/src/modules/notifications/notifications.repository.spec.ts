import { NotificationsRepository, type NewNotification } from './notifications.repository.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

const data: NewNotification = { type: 'EVENT_CREATED', title: 't', body: 'b', link: '/events/1' };
const ids = (n: number, prefix = 'u') => Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(5, '0')}`);

function setup(allUserIds: string[] = []) {
  const createMany = vi.fn().mockResolvedValue({ count: 0 });
  // Prisma の findMany（id 昇順・gt・take）を配列で再現する
  const findMany = vi.fn(({ where, take }: { where: { id: { not: string; gt?: string } }; take: number }) =>
    Promise.resolve(
      allUserIds
        .filter((id) => id !== where.id.not && (where.id.gt === undefined || id > where.id.gt))
        .slice(0, take)
        .map((id) => ({ id })),
    ),
  );
  const prisma = { notification: { createMany }, user: { findMany } } as unknown as PrismaService;
  return { repo: new NotificationsRepository(prisma), createMany, findMany };
}

describe('NotificationsRepository', () => {
  it('createForUsers: 1000件ずつに分けて INSERT する', async () => {
    const { repo, createMany } = setup();
    await repo.createForUsers(ids(2500), data);

    expect(createMany).toHaveBeenCalledTimes(3);
    expect(createMany.mock.calls.map(([arg]) => arg.data.length)).toEqual([1000, 1000, 500]);
  });

  it('createForUsers: 宛先が0人なら何もしない', async () => {
    const { repo, createMany } = setup();
    await repo.createForUsers([], data);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('createForAllUsersExcept: 全ユーザーを漏れなく重複なく、除外ユーザー以外に作る', async () => {
    const all = ids(2001);
    const { repo, createMany } = setup(all);
    await repo.createForAllUsersExcept(all[10], data);

    const created = createMany.mock.calls.flatMap(([arg]) => arg.data.map((d: { userId: string }) => d.userId));
    expect(created).toHaveLength(2000);
    expect(new Set(created).size).toBe(2000);
    expect(created).not.toContain(all[10]);
    // 1回の INSERT は1000件まで
    expect(Math.max(...createMany.mock.calls.map(([arg]) => arg.data.length))).toBeLessThanOrEqual(1000);
  });

  it('createForAllUsersExcept: ちょうど1000人でも無限ループしない', async () => {
    const { repo, findMany } = setup(ids(1001, 'a'));
    await repo.createForAllUsersExcept('a00000', data);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
