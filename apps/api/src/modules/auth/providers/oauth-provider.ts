/** ソーシャルログインで得たユーザー情報（プロバイダ共通） */
export interface OAuthProfile {
  provider: string;
  /** プロバイダ側のユーザー ID */
  providerAccountId: string;
  email: string;
  /** プロバイダがメールアドレスの所有を確認済みか。未確認なら既存ユーザーに紐付けない */
  emailVerified: boolean;
  name: string | null;
}

/**
 * ソーシャルログインのプロバイダ。Google → GitHub → X の順に追加する想定。
 * 認可コードフロー + PKCE で、コードの交換（クライアントシークレットを使う部分）は api 側で行う
 */
export interface OAuthProvider {
  readonly name: string;
  /** クライアント ID などが設定されているか */
  readonly enabled: boolean;
  /** プロバイダの認可画面の URL */
  authorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }): string;
  /** 認可コードをユーザー情報に交換する */
  exchange(params: { code: string; codeVerifier: string; redirectUri: string }): Promise<OAuthProfile>;
}
