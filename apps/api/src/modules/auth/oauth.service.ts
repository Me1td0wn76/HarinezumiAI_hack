import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthResponse, OAuthAuthorizeUrlDto, OAuthProvidersDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import { OAuthAccountsRepository } from './oauth-accounts.repository.js';
import { GoogleOAuthProvider } from './providers/google.provider.js';
import type { OAuthProfile, OAuthProvider } from './providers/oauth-provider.js';
import { OAuthAuthorizeQueryDto, OAuthLoginDto } from './dto/oauth.dto.js';

@Injectable()
export class OAuthService {
  private readonly providers: Map<string, OAuthProvider>;
  private readonly webUrl: string;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersRepository,
    private readonly accounts: OAuthAccountsRepository,
    google: GoogleOAuthProvider,
    config: ConfigService,
  ) {
    // GitHub / X を足すときはここに並べる
    this.providers = new Map([[google.name, google]]);
    this.webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  listProviders(): OAuthProvidersDto {
    return { google: this.providers.get('google')?.enabled ?? false };
  }

  authorizeUrl(name: string, query: OAuthAuthorizeQueryDto): OAuthAuthorizeUrlDto {
    const provider = this.getProvider(name);
    return { url: provider.authorizeUrl({
        state: query.state,
        codeChallenge: query.codeChallenge,
        redirectUri: this.redirectUri(name),
      }) };
  }

  async login(name: string, dto: OAuthLoginDto): Promise<AuthResponse> {
    const provider = this.getProvider(name);
    const profile = await provider.exchange({
      code: dto.code,
      codeVerifier: dto.codeVerifier,
      redirectUri: this.redirectUri(name),
    });
    return this.auth.issue(await this.findOrCreateUser(profile));
  }

  /**
   * 1. 連携済みならそのユーザー
   * 2. 同じメールアドレスのユーザーがいて、プロバイダがメールを確認済みなら紐付ける
   *    （未確認のメールで紐付けると、他人のメールアドレスを名乗ってアカウントを乗っ取れてしまう）
   * 3. どちらでもなければ新規登録（パスワードなし）
   */
  async findOrCreateUser(profile: OAuthProfile): Promise<User> {
    const linked = await this.accounts.findUser(profile.provider, profile.providerAccountId);
    if (linked) return linked;

    const existing = await this.users.findByEmail(profile.email);
    if (existing) {
      if (!profile.emailVerified) {
        throw new ConflictException(
          'このメールアドレスは既に登録されています。メールアドレスとパスワードでログインしてください',
        );
      }
      await this.accounts.link(existing.id, profile.provider, profile.providerAccountId);
      return existing;
    }

    return this.accounts.createUser({
      email: profile.email,
      displayName: (profile.name ?? profile.email.split('@')[0]).slice(0, 50),
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    });
  }

  /** web のコールバック。WEB_URL から組み立て、外から渡させない（任意の URL にコードを送らせないため） */
  private redirectUri(name: string): string {
    return `${this.webUrl}/auth/${name}/callback`;
  }

  private getProvider(name: string): OAuthProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new NotFoundException('対応していないログイン方法です');
    if (!provider.enabled) throw new ServiceUnavailableException('このログイン方法は現在使えません');
    return provider;
  }
}
