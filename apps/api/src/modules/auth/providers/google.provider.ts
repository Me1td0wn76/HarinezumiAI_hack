import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OAuthProfile, OAuthProvider } from './oauth-provider.js';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

interface GoogleIdTokenClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/**
 * Google（OpenID Connect）でのログイン。
 * ID トークンはトークンエンドポイントから TLS で直接受け取るので、署名の検証は省き
 * （OpenID Connect Core 3.1.3.7）、発行者・宛先・有効期限を確認する
 */
@Injectable()
export class GoogleOAuthProvider implements OAuthProvider {
  readonly name = 'google';
  private readonly logger = new Logger(GoogleOAuthProvider.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID') || undefined;
    this.clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') || undefined;
    if (!this.enabled) this.logger.log('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 未設定のため Google ログインは無効');
  }

  get enabled(): boolean {
    return this.clientId !== undefined && this.clientSecret !== undefined;
  }

  authorizeUrl({ state, codeChallenge, redirectUri }: { state: string; codeChallenge: string; redirectUri: string }) {
    const params = new URLSearchParams({
      client_id: this.clientId ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchange({ code, codeVerifier, redirectUri }: { code: string; codeVerifier: string; redirectUri: string }) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        client_id: this.clientId ?? '',
        client_secret: this.clientSecret ?? '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) {
      this.logger.warn(`Google のトークン交換に失敗しました（${res.status}）`);
      throw new UnauthorizedException('Google ログインに失敗しました');
    }
    const { id_token: idToken } = (await res.json()) as { id_token?: string };
    return this.toProfile(this.decodeClaims(idToken));
  }

  private decodeClaims(idToken: string | undefined): GoogleIdTokenClaims {
    const payload = idToken?.split('.')[1];
    if (!payload) throw new UnauthorizedException('Google ログインに失敗しました');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleIdTokenClaims;
  }

  private toProfile(claims: GoogleIdTokenClaims): OAuthProfile {
    const valid =
      ISSUERS.includes(claims.iss ?? '') &&
      claims.aud === this.clientId &&
      (claims.exp ?? 0) * 1000 > Date.now() &&
      !!claims.sub &&
      !!claims.email;
    if (!valid) throw new UnauthorizedException('Google ログインに失敗しました');
    return {
      provider: this.name,
      providerAccountId: claims.sub!,
      email: claims.email!.toLowerCase(),
      emailVerified: claims.email_verified === true,
      name: claims.name ?? null,
    };
  }
}
