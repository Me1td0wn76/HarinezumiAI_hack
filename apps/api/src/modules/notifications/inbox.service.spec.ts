import { NotFoundException } from '@nestjs/common';
import type { Notification, User } from '../../generated/prisma/client.js';
import { InboxService, PAGE_SIZE } from './inbox.service.js';
import type { NotificationsRepository } from './notifications.repository.js';

const user = { id: 'me' } as User;

function row(i: number): Notification {
  return {
    id: `n${i}`,
    userId: 'me',
    type: 'EVENT_CREATED',
    title: 't',
    body: 'b',
    link: '/events/1',
    readAt: null,
    createdAt: new Date(Date.UTC(2026, 0, 1) - i * 1000),
  };
}

describe('InboxService.list', () => {
  function setup(rows: Notification[], owned: Notification | null = null) {
    const repo = {
      findPageByUser: vi.fn((_u: string, take: number) => Promise.resolve(rows.slice(0, take))),
      findOwned: vi.fn().mockResolvedValue(owned),
    };
    return { service: new InboxService(repo as unknown as NotificationsRepository), repo };
  }

  it('件数が1ページ以内なら nextCursor は null', async () => {
    const { service } = setup(Array.from({ length: PAGE_SIZE }, (_, i) => row(i)));
    const res = await service.list(user);
    expect(res.items).toHaveLength(PAGE_SIZE);
    expect(res.nextCursor).toBeNull();
  });

  it('続きがあれば1ページ分だけ返し、最後の id を nextCursor にする', async () => {
    const { service } = setup(Array.from({ length: PAGE_SIZE + 5 }, (_, i) => row(i)));
    const res = await service.list(user);
    expect(res.items).toHaveLength(PAGE_SIZE);
    expect(res.nextCursor).toBe(`n${PAGE_SIZE - 1}`);
  });

  it('before が自分の通知でなければ 404', async () => {
    const { service, repo } = setup([], null);
    await expect(service.list(user, 'other')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOwned).toHaveBeenCalledWith('other', 'me');
  });

  it('before の通知を起点に続きを取る', async () => {
    const cursor = row(3);
    const { service, repo } = setup([row(4)], cursor);
    await service.list(user, 'n3');
    expect(repo.findPageByUser).toHaveBeenCalledWith('me', PAGE_SIZE + 1, cursor);
  });
});
