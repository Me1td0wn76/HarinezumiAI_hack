import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { PasswordResetService, TOKEN_TTL_MS, hashToken } from './password-reset.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { isIssuedBeforePasswordChange } from './jwt.strategy.js';
import { UsersRepository } from '../users/users.repository.js';
import { MailService } from '../mail/mail.service.js';
import { buildUser } from '../../test-support/event-factories.js';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let resets: {
    replace: ReturnType<typeof vi.fn>;
    findByHash: ReturnType<typeof vi.fn>;
    resetPasswordWithToken: ReturnType<typeof vi.fn>;
  };
  let users: { findByEmail: ReturnType<typeof vi.fn> };
  let mail: { send: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    resets = { replace: vi.fn(), findByHash: vi.fn(), resetPasswordWithToken: vi.fn() };
    users = { findByEmail: vi.fn() };
    mail = { send: vi.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PasswordResetRepository, useValue: resets },
        { provide: UsersRepository, useValue: users },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: { get: (_key: string, fallback?: string) => fallback } },
      ],
    }).compile();

    service = module.get(PasswordResetService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('request', () => {
    it('未登録のメールアドレスでもエラーにせず、トークンもメールも作らない', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.request({ email: 'nobody@example.com' })).resolves.toBeUndefined();
      expect(resets.replace).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('メールアドレスは小文字にして検索する', async () => {
      users.findByEmail.mockResolvedValue(null);
      await service.request({ email: 'Foo@Example.COM' });
      expect(users.findByEmail).toHaveBeenCalledWith('foo@example.com');
    });

    it('DB にはトークンのハッシュだけを保存し、平文はメールのリンクにだけ含める', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      const before = Date.now();

      await service.request({ email: 'organizer@example.com' });

      const [userId, tokenHash, expiresAt] = resets.replace.mock.calls[0] as [string, string, Date];
      expect(userId).toBe('user-1');
      const text = (mail.send.mock.calls[0][0] as { text: string }).text;
      const token = /token=([A-Za-z0-9_-]+)/.exec(text)?.[1];
      expect(token).toBeDefined();
      expect(token!.length).toBeGreaterThanOrEqual(43); // 32 バイト
      expect(tokenHash).toBe(hashToken(token!));
      expect(tokenHash).not.toContain(token!);
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + TOKEN_TTL_MS);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + TOKEN_TTL_MS);
    });

    it('メール送信が失敗しても応答は変わらない（登録の有無を推測させない）', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      mail.send.mockRejectedValue(new Error('network'));

      await expect(service.request({ email: 'organizer@example.com' })).resolves.toBeUndefined();
    });
  });

  describe('confirm', () => {
    const future = () => new Date(Date.now() + 60_000);

    it('存在しないトークンは 400', async () => {
      resets.findByHash.mockResolvedValue(null);

      await expect(service.confirm({ token: 'x', password: 'new-password' })).rejects.toThrow(BadRequestException);
      expect(resets.resetPasswordWithToken).not.toHaveBeenCalled();
    });

    it('期限切れのトークンは 400', async () => {
      resets.findByHash.mockResolvedValue({ id: 't', userId: 'user-1', expiresAt: new Date(Date.now() - 1) });

      await expect(service.confirm({ token: 'x', password: 'new-password' })).rejects.toThrow(BadRequestException);
      expect(resets.resetPasswordWithToken).not.toHaveBeenCalled();
    });

    it('有効なトークンならハッシュ化したパスワードで更新する', async () => {
      resets.findByHash.mockResolvedValue({ id: 't', userId: 'user-1', expiresAt: future() });
      resets.resetPasswordWithToken.mockResolvedValue(true);

      await service.confirm({ token: 'raw-token', password: 'new-password' });

      const [tokenHash, passwordHash] = resets.resetPasswordWithToken.mock.calls[0] as [string, string, Date];
      expect(resets.findByHash).toHaveBeenCalledWith(hashToken('raw-token'));
      expect(tokenHash).toBe(hashToken('raw-token'));
      expect(passwordHash).not.toBe('new-password');
      await expect(compare('new-password', passwordHash)).resolves.toBe(true);
    });

    it('同時送信などで先に使われていたら 400（リンクは1回しか使えない）', async () => {
      resets.findByHash.mockResolvedValue({ id: 't', userId: 'user-1', expiresAt: future() });
      resets.resetPasswordWithToken.mockResolvedValue(false);

      await expect(service.confirm({ token: 'raw-token', password: 'new-password' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

describe('isIssuedBeforePasswordChange', () => {
  const changedAt = new Date('2026-09-24T10:00:00.500Z');
  const sec = Math.floor(changedAt.getTime() / 1000);

  it('再設定していなければ常に有効', () => {
    expect(isIssuedBeforePasswordChange({ sub: 'u', iat: 0 }, null)).toBe(false);
  });

  it('再設定より前の秒に発行したトークンは無効', () => {
    expect(isIssuedBeforePasswordChange({ sub: 'u', iat: sec - 1 }, changedAt)).toBe(true);
  });

  it('再設定と同じ秒以降に発行したトークンは有効（再設定直後のログイン）', () => {
    expect(isIssuedBeforePasswordChange({ sub: 'u', iat: sec }, changedAt)).toBe(false);
    expect(isIssuedBeforePasswordChange({ sub: 'u', iat: sec + 60 }, changedAt)).toBe(false);
  });

  it('iat の無いトークンは再設定後は無効', () => {
    expect(isIssuedBeforePasswordChange({ sub: 'u' }, changedAt)).toBe(true);
  });
});
