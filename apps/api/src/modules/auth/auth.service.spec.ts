import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import type { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import { isIssuedBeforePasswordChange, type JwtPayload } from './jwt.strategy.js';
import { buildUser } from '../../test-support/event-factories.js';

function setup(user: ReturnType<typeof buildUser> | null) {
  const users = { findByEmail: vi.fn().mockResolvedValue(user) };
  const jwt = new JwtService({ secret: 'test-secret' });
  const service = new AuthService(users as unknown as UsersRepository, jwt);
  return { service, jwt };
}

describe('AuthService.login', () => {
  it('パスワードが合えばログインできる', async () => {
    const { service } = setup(buildUser({ passwordHash: await hash('password123', 4) }));
    await expect(service.login({ email: 'organizer@example.com', password: 'password123' })).resolves.toHaveProperty(
      'accessToken',
    );
  });

  it('Google だけで登録したユーザー（passwordHash が NULL）は落ちずに 401', async () => {
    const { service } = setup(buildUser({ passwordHash: null }));
    await expect(service.login({ email: 'organizer@example.com', password: 'password123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('未登録のメールアドレスも同じ 401', async () => {
    const { service } = setup(null);
    await expect(service.login({ email: 'nobody@example.com', password: 'password123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('AuthService.issue（Google ログインもこれで JWT を発行する）', () => {
  it('発行したトークンには iat が入り、パスワード再設定より前のものは無効と判定される', () => {
    const { service, jwt } = setup(null);
    const { accessToken } = service.issue(buildUser({ passwordHash: null }));
    const payload = jwt.verify<JwtPayload>(accessToken);
    expect(payload.iat).toEqual(expect.any(Number));

    const issuedAt = new Date(payload.iat! * 1000);
    expect(isIssuedBeforePasswordChange(payload, new Date(issuedAt.getTime() + 1000))).toBe(true);
    expect(isIssuedBeforePasswordChange(payload, issuedAt)).toBe(false);
    expect(isIssuedBeforePasswordChange(payload, null)).toBe(false);
  });
});
