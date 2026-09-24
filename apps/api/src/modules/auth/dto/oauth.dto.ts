import type { OAuthLoginRequest } from '@lt/shared';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** PKCE の code_verifier / code_challenge と state は base64url の文字列 */
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export class OAuthAuthorizeQueryDto {
  @IsString()
  @Matches(BASE64URL)
  @MaxLength(128)
  state: string;

  @IsString()
  @Matches(BASE64URL)
  @MinLength(43)
  @MaxLength(128)
  codeChallenge: string;
}

export class OAuthLoginDto implements OAuthLoginRequest {
  @IsString()
  @MaxLength(2048)
  code: string;

  @IsString()
  @Matches(BASE64URL)
  @MinLength(43)
  @MaxLength(128)
  codeVerifier: string;
}
