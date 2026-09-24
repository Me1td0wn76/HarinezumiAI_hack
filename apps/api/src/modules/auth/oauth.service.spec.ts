import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { User } from '../../generated/prisma/client.js';
import type { UsersRepository } from '../users/users.repository.js';
import type { AuthService } from './auth.service.js';
import type { OAuthAccountsRepository } from './oauth-accounts.repository.js';
import { OAuthService } from './oauth.service.js';
import type { GoogleOAuthProvider } from './providers/google.provider.js';
import type { OAuthProfile } from './providers/oauth-provider.js';

function user(overrides: Partial<User>): User {
  return {
    id: 'u1',
    email: 'taro@example.com',
    passwordHash: 'hash',
    displayName: '太郎',
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const profile = (overrides: Partial<OAuthProfile> = {}): OAuthProfile => ({
  provider: 'google',
  providerAccountId: 'google-sub-1',
  email: 'taro@example.com',
  emailVerified: true,
  name: 'Taro Yamada',
  ...overrides,
});

function setup({ linked = null, existing = null }: { linked?: User | null; existing?: User | null } = {}) {
  const accounts = {
    findUser: vi.fn().mockResolvedValue(linked),
    link: vi.fn().mockResolvedValue(undefined),
    createUser: vi.fn().mockImplementation((input: { email: string; displayName: string }) =>
      Promise.resolve(user({ id: 'new', email: input.email, displayName: input.displayName, passwordHash: null })),
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
  it('連携済みならそのユーザーを返し、新たに紐付けない', async () => {
    const linked = user({ id: 'linked' });
    const { service, accounts } = setup({ linked });
    await expect(service.findOrCreateUser(profile())).resolves.toBe(linked);
    expect(accounts.link).not.toHaveBeenCalled();
    expect(accounts.createUser).not.toHaveBeenCalled();
  });

  it('同じメールの既存ユーザーがいて、メールが確認済みなら紐付ける', async () => {
    const existing = user({ id: 'existing' });
    const { service, accounts } = setup({ existing });
    await expect(service.findOrCreateUser(profile())).resolves.toBe(existing);
    expect(accounts.link).toHaveBeenCalledWith('existing', 'google', 'google-sub-1');
  });

  it('メールが未確認なら既存ユーザーに紐付けない（乗っ取り防止）', async () => {
    const { service, accounts } = setup({ existing: user({ id: 'existing' }) });
    await expect(service.findOrCreateUser(profile({ emailVerified: false }))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(accounts.link).not.toHaveBeenCalled();
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
});
