import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma, type User } from '../../generated/prisma/client.js';

/** 他人に見せるユーザー情報（PublicUserDto）の取得条件。メールアドレスは含めない */
export const publicUserSelect = {
  id: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** @param handle 小文字に正規化済みのハンドル */
  findByHandle(handle: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { handle } });
  }

  /** メールアドレスかハンドルが一意制約に当たった（同時に登録された）ときは null を返す */
  async create(data: Prisma.UserCreateInput): Promise<User | null> {
    try {
      return await this.prisma.user.create({ data });
    } catch (err) {
      if (isUniqueViolation(err)) return null;
      throw err;
    }
  }

  /** ハンドルが一意制約に当たった（同時に同じハンドルへ変更された）ときは null を返す */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User | null> {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (err) {
      if (isUniqueViolation(err)) return null;
      throw err;
    }
  }
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
