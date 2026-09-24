import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { User } from '../../generated/prisma/client.js';

@Injectable()
export class OAuthAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 連携済みのユーザー */
  async findUser(provider: string, providerAccountId: string): Promise<User | null> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });
    return account?.user ?? null;
  }

  async link(userId: string, provider: string, providerAccountId: string): Promise<void> {
    await this.prisma.oAuthAccount.create({ data: { userId, provider, providerAccountId } });
  }

  /** パスワードなしのユーザーを作り、同時に連携する */
  createUser(input: { email: string; displayName: string; provider: string; providerAccountId: string }): Promise<User> {
    const { email, displayName, provider, providerAccountId } = input;
    return this.prisma.user.create({
      data: { email, displayName, oauthAccounts: { create: { provider, providerAccountId } } },
    });
  }
}
