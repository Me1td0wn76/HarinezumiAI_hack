import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PasswordResetToken } from '../../generated/prisma/client.js';

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 以前に発行したトークンを捨てて、新しいトークンを保存する（有効なリンクは常に最新の1つだけ） */
  async replace(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }

  findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  /**
   * トークンを消費してパスワードを更新し、そのユーザーのトークンをすべて消す（リンクは1回しか使えない）。
   * トークンの削除件数で消費を判定するので、同じリンクで同時に送信されても成功するのは1回だけ。
   * トークンが無い・期限切れなら何もせず false を返す。
   */
  async resetPasswordWithToken(tokenHash: string, passwordHash: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!record) return false;
      const { count } = await tx.passwordResetToken.deleteMany({ where: { id: record.id, expiresAt: { gt: now } } });
      if (count === 0) return false;
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash, passwordChangedAt: now } });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
      return true;
    });
  }
}
