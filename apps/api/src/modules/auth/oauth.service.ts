import { ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
    const url = provider.authorizeUrl({
      state: query.state,
      codeChallenge: query.codeChallenge,
      redirectUri: this.redirectUri(name),
    });
    return { url };
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
   * 2. 同じメールアドレスのユーザーが既にいれば 409。既存アカウントへの自動紐付けはしない。
   *    /auth/register はメールアドレスの所有を確認しないので、攻撃者が他人のメールで先に登録しておくと、
   *    本人の Google ログインが攻撃者のアカウントに紐付き、攻撃者はパスワードで入り続けられてしまう（事前乗っ取り）
   * 3. どちらでもなければ新規登録（パスワードなし）。プロバイダがメールを確認済みの場合に限る。
   *    利用規約への同意の扱いは未決定のため、暫定で termsAcceptedAt は null のまま作る
   */
  async findOrCreateUser(profile: OAuthProfile): Promise<User> {
    const linked = await this.accounts.findUser(profile.provider, profile.providerAccountId);
    if (linked) return linked;

    if (await this.users.findByEmail(profile.email)) throw emailConflict();
    // 未確認のメールで登録させると、本人がそのメールで登録できなくなる
    if (!profile.emailVerified) {
      throw new ForbiddenException('メールアドレスが確認されていないアカウントでは登録できません');
    }

    const created = await this.accounts.createUser({
      email: profile.email,
      displayName: (profile.name ?? profile.email.split('@')[0]).slice(0, 50),
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    });
    if (created) return created;

    // 一意制約違反（同時に届いたコールバックなど）。同じ連携が先に作られていればそのユーザーでログインさせる
    const raced = await this.accounts.findUser(profile.provider, profile.providerAccountId);
    if (raced) return raced;
    throw emailConflict();
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

function emailConflict(): ConflictException {
  return new ConflictException(
    'このメールアドレスは既に登録されています。メールアドレスとパスワードでログインしてください',
  );
}
