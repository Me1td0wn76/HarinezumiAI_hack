import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { MailService } from '../mail/mail.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { BCRYPT_ROUNDS } from './auth.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { ConfirmPasswordResetDto, RequestPasswordResetDto } from './dto/password-reset.dto.js';

/** リセット用リンクの有効期限 */
export const TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function invalidLink(): BadRequestException {
  return new BadRequestException('リンクが無効か期限切れです。もう一度再設定をリクエストしてください');
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly webUrl: string;

  constructor(
    private readonly resets: PasswordResetRepository,
    private readonly users: UsersRepository,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  /**
   * リセット用リンクをメールで送る。
   * 登録の有無で応答を変えない（メールアドレスの存在を推測させない。AuthService.login と同じ方針）。
   * メールの送信は待たない: 応答時間の差や送信失敗（500）から登録の有無が分からないように
   */
  async request(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user) return;

    const token = randomBytes(32).toString('base64url');
    await this.resets.replace(user.id, hashToken(token), new Date(Date.now() + TOKEN_TTL_MS));
    this.mail
      .send({
        to: user.email,
        subject: '【LT会支援アプリ】パスワードの再設定',
        text: [
          `${user.displayName} さん`,
          '',
          'パスワード再設定のリクエストを受け付けました。30分以内に次のリンクから新しいパスワードを設定してください。',
          `${this.webUrl}/password-reset/confirm?token=${token}`,
          '',
          'このメールに心当たりがない場合は、何もせずに破棄してください。パスワードは変更されません。',
        ].join('\n'),
      })
      .catch((err: unknown) => this.logger.warn(`再設定メールの送信に失敗しました: ${String(err)}`));
  }

  /** トークンを確認して新しいパスワードを設定する。以前に発行したログイン（JWT）は無効になる */
  async confirm(dto: ConfirmPasswordResetDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    // 無効なリンクは bcrypt を回す前に弾く。確定の判定は resetPasswordWithToken で改めて行う（同時送信対策）
    const record = await this.resets.findByHash(tokenHash);
    if (!record || record.expiresAt <= new Date()) throw invalidLink();

    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    if (!(await this.resets.resetPasswordWithToken(tokenHash, passwordHash, new Date()))) throw invalidLink();
  }
}
