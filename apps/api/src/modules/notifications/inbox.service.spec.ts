import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Notification, User } from '../../generated/prisma/client.js';
import { InboxService, PAGE_SIZE } from './inbox.service.js';
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
  type NotificationsRepository,
} from './notifications.repository.js';

const user = { id: 'me' } as User;

function row(i: number): Notification {
  return {
    id: `n${i}`,
    userId: 'me',
    type: 'EVENT_CREATED',
    eventId: 'event-1',
    data: { eventTitle: 't', organizerName: 'o', candidateDateCount: 1 },
    readAt: null,
    createdAt: new Date(Date.UTC(2026, 0, 1) - i * 1000),
  };
}

function setup(rows: Notification[], owned: Notification | null = null) {
  const repo = {
    findPageByUser: vi.fn((_u: string, take: number) => Promise.resolve(rows.slice(0, take))),
    findOwned: vi.fn().mockResolvedValue(owned),
    markRead: vi.fn().mockResolvedValue(undefined),
  };
  return { service: new InboxService(repo as unknown as NotificationsRepository), repo };
}

describe('InboxService.list', () => {
  it('件数が1ページ以内なら nextCursor は null', async () => {
    const { service } = setup(Array.from({ length: PAGE_SIZE }, (_, i) => row(i)));
    const res = await service.list(user);
    expect(res.items).toHaveLength(PAGE_SIZE);
    expect(res.nextCursor).toBeNull();
  });

  it('続きがあれば1ページ分だけ返し、最後の通知の位置を nextCursor にする', async () => {
    const { service } = setup(Array.from({ length: PAGE_SIZE + 5 }, (_, i) => row(i)));
    const res = await service.list(user);
    expect(res.items).toHaveLength(PAGE_SIZE);
    const last = row(PAGE_SIZE - 1);
    expect(decodeNotificationCursor(res.nextCursor!)).toEqual({ createdAt: last.createdAt, id: last.id });
  });

  it('cursor の位置から続きを取る（その通知が消えていても取れる）', async () => {
    const { service, repo } = setup([row(4)]);
    const cursor = { createdAt: row(3).createdAt, id: 'n3' };
    await service.list(user, encodeNotificationCursor(cursor));
    expect(repo.findPageByUser).toHaveBeenCalledWith('me', PAGE_SIZE + 1, cursor);
  });

  it('壊れた cursor は 400（GET /events と同じ）', async () => {
    const { service } = setup([]);
    await expect(service.list(user, 'abc')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('InboxService.markRead', () => {
  it('本人の ID を渡して既読にする', async () => {
    const { service, repo } = setup([], row(1));
    await service.markRead('n1', user);
    expect(repo.markRead).toHaveBeenCalledWith('n1', 'me');
  });

  it('本人の通知でなければ 404', async () => {
    const { service } = setup([], null);
    await expect(service.markRead('other', user)).rejects.toBeInstanceOf(NotFoundException);
  });
});
