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

  /** パスワードを更新し、そのユーザーのトークンをすべて消す（リンクは1回しか使えない） */
  async resetPassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash, passwordChangedAt: new Date() } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
    ]);
  }
}
