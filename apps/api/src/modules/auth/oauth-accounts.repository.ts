import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma, type User } from '../../generated/prisma/client.js';

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

  /**
   * パスワードなしのユーザーを作り、同時に連携する。
   * メールアドレス・ハンドル・連携のいずれかが一意制約に当たった（同時に作られた）ときは null を返す
   */
  async createUser(input: {
    email: string;
    handle: string;
    displayName: string;
    provider: string;
    providerAccountId: string;
  }): Promise<User | null> {
    const { email, handle, displayName, provider, providerAccountId } = input;
    try {
      return await this.prisma.user.create({
        data: {
          email,
          handle,
          displayName,
          // 利用規約への同意の扱いは未決定（暫定で未同意のまま作る）
          termsAcceptedAt: null,
          oauthAccounts: { create: { provider, providerAccountId } },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return null;
      throw err;
    }
  }
}
