import { NotFoundException } from '@nestjs/common';
import type { UsersRepository } from '../users/users.repository.js';
import type { EventsRepository } from '../events/events.repository.js';
import type { BlocksRepository } from '../blocks/blocks.repository.js';
import type { FollowsRepository } from '../follows/follows.repository.js';
import { ProfilesService } from './profiles.service.js';
import { buildUser } from '../../test-support/event-factories.js';

function setup(owner: ReturnType<typeof buildUser> | null = buildUser()) {
  const users = { findByHandle: vi.fn().mockResolvedValue(owner) };
  const events = {
    findPublicByOrganizer: vi.fn().mockResolvedValue([]),
    findUpcomingRespondedBy: vi.fn().mockResolvedValue([]),
  };
  const blocks = { findBlockedIds: vi.fn().mockResolvedValue(['blocked-1']) };
  const follows = {
    countFor: vi.fn().mockResolvedValue({ followers: 3, following: 5 }),
    exists: vi.fn().mockResolvedValue(true),
  };
  const service = new ProfilesService(
    users as unknown as UsersRepository,
    events as unknown as EventsRepository,
    blocks as unknown as BlocksRepository,
    follows as unknown as FollowsRepository,
  );
  return { service, users, events, blocks, follows };
}

describe('ProfilesService.getByHandle', () => {
  it('メールアドレスを返さない', async () => {
    const { service } = setup();
    const profile = await service.getByHandle('organizer', null);
    expect(profile.user).toEqual({
      id: 'user-1',
      handle: 'organizer',
      displayName: '主催者',
      avatarUrl: null,
      bio: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(JSON.stringify(profile)).not.toContain('organizer@example.com');
  });

  it('大文字で指定しても小文字のハンドルで探す', async () => {
    const { service, users } = setup();
    await service.getByHandle('Organizer', null);
    expect(users.findByHandle).toHaveBeenCalledWith('organizer');
  });

  it('形式に合わないハンドルは DB に問い合わせず 404', async () => {
    const { service, users } = setup();
    await expect(service.getByHandle('a-b', null)).rejects.toBeInstanceOf(NotFoundException);
    expect(users.findByHandle).not.toHaveBeenCalled();
  });

  it('存在しないハンドルは 404', async () => {
    const { service } = setup(null);
    await expect(service.getByHandle('nobody', null)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ログインしていれば、ブロックした相手の主催分を除くよう渡す', async () => {
    const { service, events } = setup();
    await service.getByHandle('organizer', buildUser({ id: 'viewer' }));
    expect(events.findPublicByOrganizer).toHaveBeenCalledWith('user-1', ['blocked-1']);
    expect(events.findUpcomingRespondedBy).toHaveBeenCalledWith('user-1', expect.any(Date), ['blocked-1']);
  });

  it('未ログインならブロックを調べない', async () => {
    const { service, blocks, events } = setup();
    await service.getByHandle('organizer', null);
    expect(blocks.findBlockedIds).not.toHaveBeenCalled();
    expect(events.findPublicByOrganizer).toHaveBeenCalledWith('user-1', []);
  });

  it('フォロワー数・フォロー中の数と、閲覧者がフォロー中かを返す', async () => {
    const { service, follows } = setup();
    const profile = await service.getByHandle('organizer', buildUser({ id: 'viewer' }));
    expect(follows.exists).toHaveBeenCalledWith('viewer', 'user-1');
    expect(profile).toMatchObject({ followerCount: 3, followingCount: 5, isFollowing: true });
  });

  it('未ログインや自分自身のプロフィールでは、フォロー中かを調べず false', async () => {
    const { service, follows } = setup();
    expect((await service.getByHandle('organizer', null)).isFollowing).toBe(false);
    expect((await service.getByHandle('organizer', buildUser())).isFollowing).toBe(false);
    expect(follows.exists).not.toHaveBeenCalled();
  });
});
