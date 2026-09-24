import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { User } from '../../generated/prisma/client.js';
import type { UsersRepository } from '../users/users.repository.js';
import type { AuthService } from './auth.service.js';
import type { OAuthAccountsRepository } from './oauth-accounts.repository.js';
import { OAuthService } from './oauth.service.js';
import { buildUser } from '../../test-support/event-factories.js';
import type { GoogleOAuthProvider } from './providers/google.provider.js';
import type { OAuthProfile } from './providers/oauth-provider.js';

function user(overrides: Partial<User>): User {
  return buildUser({ id: 'u1', email: 'taro@example.com', displayName: '太郎', ...overrides });
}

const profile = (overrides: Partial<OAuthProfile> = {}): OAuthProfile => ({
  provider: 'google',
  providerAccountId: 'google-sub-1',
  email: 'taro@example.com',
  emailVerified: true,
  name: 'Taro Yamada',
  ...overrides,
});

function setup({
  linked = null,
  existing = null,
  created,
}: { linked?: User | null; existing?: User | null; created?: User | null } = {}) {
  const accounts = {
    findUser: vi.fn().mockResolvedValue(linked),
    createUser: vi
      .fn()
      .mockImplementation((input: { email: string; displayName: string }) =>
        Promise.resolve(
          created !== undefined
            ? created
            : user({ id: 'new', email: input.email, displayName: input.displayName, passwordHash: null }),
        ),
      ),
  };
  const users = { findByEmail: vi.fn().mockResolvedValue(existing) };
  const google = { name: 'google', enabled: true } as GoogleOAuthProvider;
  const config = { get: (_key: string, fallback?: string) => fallback } as ConfigService;
  const service = new OAuthService(
    {} as AuthService,
    users as unknown as UsersRepository,
    accounts as unknown as OAuthAccountsRepository,
    google,
    config,
  );
  return { service, accounts, users };
}

describe('OAuthService.findOrCreateUser', () => {
  it('連携済みならそのユーザーを返し、新たに登録しない', async () => {
    const linked = user({ id: 'linked' });
    const { service, accounts, users } = setup({ linked });
    await expect(service.findOrCreateUser(profile())).resolves.toBe(linked);
    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(accounts.createUser).not.toHaveBeenCalled();
  });

  it('同じメールのパスワードアカウントがあれば、メールが確認済みでも紐付けずに 409（事前乗っ取り防止）', async () => {
    const { service, accounts } = setup({ existing: user({ id: 'existing' }) });
    const result = service.findOrCreateUser(profile());
    await expect(result).rejects.toBeInstanceOf(ConflictException);
    await expect(result).rejects.toThrow('パスワードでログインしてください');
    expect(accounts.createUser).not.toHaveBeenCalled();
  });

  it('同じメールの既存ユーザーがいれば、メールが未確認でも 409', async () => {
    const { service, accounts } = setup({ existing: user({ id: 'existing' }) });
    await expect(service.findOrCreateUser(profile({ emailVerified: false }))).rejects.toBeInstanceOf(ConflictException);
    expect(accounts.createUser).not.toHaveBeenCalled();
  });

  it('メールが未確認なら新規登録しない', async () => {
    const { service, accounts } = setup();
    await expect(service.findOrCreateUser(profile({ emailVerified: false }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(accounts.createUser).not.toHaveBeenCalled();
  });

  it('該当ユーザーがいなければパスワードなしで新規登録する', async () => {
    const { service, accounts } = setup();
    const created = await service.findOrCreateUser(profile());
    expect(created.passwordHash).toBeNull();
    expect(accounts.createUser).toHaveBeenCalledWith({
      email: 'taro@example.com',
      displayName: 'Taro Yamada',
      provider: 'google',
      providerAccountId: 'google-sub-1',
    });
  });

  it('名前が無ければメールアドレスの @ より前を表示名にする', async () => {
    const { service, accounts } = setup();
    await service.findOrCreateUser(profile({ name: null, email: 'hanako@example.com' }));
    expect(accounts.createUser).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'hanako' }));
  });

  it('同時のコールバックで一意制約に当たり、同じ連携が先に作られていればそのユーザーを返す', async () => {
    const raced = user({ id: 'raced', passwordHash: null });
    const { service, accounts } = setup({ created: null });
    accounts.findUser.mockResolvedValueOnce(null).mockResolvedValueOnce(raced);
    await expect(service.findOrCreateUser(profile())).resolves.toBe(raced);
  });

  it('一意制約に当たり、連携も見つからなければ 409（500 にしない）', async () => {
    const { service } = setup({ created: null });
    await expect(service.findOrCreateUser(profile())).rejects.toBeInstanceOf(ConflictException);
  });
});
