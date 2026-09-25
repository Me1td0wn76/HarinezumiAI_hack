import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { HANDLE_MAX_LENGTH, type AuthResponse, type OAuthAuthorizeUrlDto, type OAuthProvidersDto } from '@lt/shared';
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
      handle: await this.availableHandle(profile.email),
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

  /**
   * 使われていない仮ハンドル。ランダム部分が既存と重なることはまず無いが、重なると一意制約違反が
   * 「メールアドレスが登録済み」の 409 に化けるので、空いているものを選んでから作る
   */
  private async availableHandle(email: string): Promise<string> {
    for (let i = 0; i < HANDLE_GENERATION_ATTEMPTS; i++) {
      const handle = generateHandle(email);
      if (!(await this.users.findByHandle(handle))) return handle;
    }
    throw new ServiceUnavailableException('ハンドルを作成できませんでした。もう一度お試しください');
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

const HANDLE_GENERATION_ATTEMPTS = 5;

/**
 * ソーシャルログインで登録したユーザーの仮のハンドル（本人が /me で変更できる）。
 * メールアドレスの @ より前から使える文字だけを残し、ランダムな 6 文字を足して重複を避ける。
 * 末尾が "_xxxxxx" なので予約語（RESERVED_HANDLES）とは一致しない
 */
export function generateHandle(email: string): string {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, HANDLE_MAX_LENGTH - 7);
  return `${base.length >= 3 ? base : 'user'}_${randomBytes(3).toString('hex')}`;
}
