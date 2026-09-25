import { ConflictException } from '@nestjs/common';
import type { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import { buildUser } from '../../test-support/event-factories.js';

function setup({ taken = null, updated = buildUser() }: { taken?: unknown; updated?: unknown } = {}) {
  const users = {
    findByHandle: vi.fn().mockResolvedValue(taken),
    update: vi.fn().mockResolvedValue(updated),
  };
  const service = new UsersService(users as unknown as UsersRepository);
  return { service, users };
}

describe('UsersService.updateProfile', () => {
  it('ほかの人が使っているハンドルには変更できない（409）', async () => {
    const { service, users } = setup({ taken: buildUser({ id: 'other', handle: 'taro' }) });
    await expect(service.updateProfile(buildUser(), { handle: 'taro' })).rejects.toBeInstanceOf(ConflictException);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('今のハンドルのまま保存しても重複扱いにしない', async () => {
    const { service, users } = setup({ taken: buildUser() });
    await service.updateProfile(buildUser(), { handle: 'organizer', displayName: '新しい名前' });
    expect(users.findByHandle).not.toHaveBeenCalled();
    expect(users.update).toHaveBeenCalled();
  });

  it('確認と更新の間に同じハンドルを取られたら 409', async () => {
    const { service } = setup({ updated: null });
    await expect(service.updateProfile(buildUser(), { handle: 'hanako' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('avatarUrl の null は解除、undefined は変更なしとして渡す', async () => {
    const { service, users } = setup();
    await service.updateProfile(buildUser(), { avatarUrl: null });
    expect(users.update).toHaveBeenLastCalledWith('user-1', expect.objectContaining({ avatarUrl: null }));
    await service.updateProfile(buildUser(), { bio: 'こんにちは' });
    expect(users.update).toHaveBeenLastCalledWith('user-1', expect.objectContaining({ avatarUrl: undefined }));
  });

  it('返す UserDto にハンドルとアバターが入る', async () => {
    const { service } = setup({ updated: buildUser({ handle: 'hanako', avatarUrl: 'https://example.com/a.png' }) });
    await expect(service.updateProfile(buildUser(), { handle: 'hanako' })).resolves.toMatchObject({
      handle: 'hanako',
      avatarUrl: 'https://example.com/a.png',
    });
  });
});
