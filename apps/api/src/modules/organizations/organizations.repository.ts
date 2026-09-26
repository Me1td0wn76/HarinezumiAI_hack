import { Injectable } from '@nestjs/common';
import type { OrganizationRole } from '@lt/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma, type Organization } from '../../generated/prisma/client.js';
import { publicUserSelect } from '../users/users.repository.js';

/** 団体一覧で返す最大件数（新しい順） */
const LIST_LIMIT = 50;

/** LT会のカードや詳細に載せる団体情報（OrganizationSummaryDto）の取得条件 */
export const organizationSummarySelect = {
  id: true,
  slug: true,
  name: true,
} satisfies Prisma.OrganizationSelect;

export type OrganizationSummary = Prisma.OrganizationGetPayload<{ select: typeof organizationSummarySelect }>;

const listItemInclude = {
  _count: { select: { members: true } },
} satisfies Prisma.OrganizationInclude;

export type OrganizationListItem = Prisma.OrganizationGetPayload<{ include: typeof listItemInclude }>;

/** 団体ページに必要な関連。メンバーは OWNER が先（enum の定義順）、その中は参加が古い順 */
const detailInclude = {
  ...listItemInclude,
  members: {
    include: { user: { select: publicUserSelect } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.OrganizationInclude;

export type OrganizationDetail = Prisma.OrganizationGetPayload<{ include: typeof detailInclude }>;

const memberInclude = { user: { select: publicUserSelect } } satisfies Prisma.OrganizationMemberInclude;

export type OrganizationMemberWithUser = Prisma.OrganizationMemberGetPayload<{ include: typeof memberInclude }>;

export type MyOrganization = Prisma.OrganizationMemberGetPayload<{
  include: { organization: { select: typeof organizationSummarySelect } };
}>;

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecent(): Promise<OrganizationListItem[]> {
    return this.prisma.organization.findMany({
      include: listItemInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    });
  }

  /** @param slug 小文字に正規化済みの slug */
  findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  /** @param slug 小文字に正規化済みの slug */
  findDetailBySlug(slug: string): Promise<OrganizationDetail | null> {
    return this.prisma.organization.findUnique({ where: { slug }, include: detailInclude });
  }

  /** userId が所属する団体（名前順） */
  findManyByMember(userId: string): Promise<MyOrganization[]> {
    return this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: { select: organizationSummarySelect } },
      orderBy: { organization: { name: 'asc' } },
    });
  }

  /** 所属していなければ null */
  async findRole(organizationId: string, userId: string): Promise<OrganizationRole | null> {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true },
    });
    return member?.role ?? null;
  }

  countOwners(organizationId: string): Promise<number> {
    return this.prisma.organizationMember.count({ where: { organizationId, role: 'OWNER' } });
  }

  /** 作成者を OWNER として同時に登録する。slug が一意制約に当たったときは null を返す */
  async create(
    data: Pick<Prisma.OrganizationCreateInput, 'name' | 'slug' | 'description' | 'webhookUrl'>,
    ownerId: string,
  ): Promise<Organization | null> {
    return nullOnUniqueViolation(() =>
      this.prisma.organization.create({
        data: { ...data, members: { create: { userId: ownerId, role: 'OWNER' } } },
      }),
    );
  }

  /** slug が一意制約に当たった（同時に同じ slug へ変更された）ときは null を返す */
  async update(
    id: string,
    data: Pick<Prisma.OrganizationUpdateInput, 'name' | 'slug' | 'description' | 'webhookUrl'>,
  ): Promise<Organization | null> {
    return nullOnUniqueViolation(() => this.prisma.organization.update({ where: { id }, data }));
  }

  /** メンバーは cascade で消え、紐付いていたLT会は団体なしになる（SetNull） */
  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } });
  }

  /** 既にメンバーなら null を返す */
  async addMember(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMemberWithUser | null> {
    return nullOnUniqueViolation(() =>
      this.prisma.organizationMember.create({
        data: { organizationId, userId, role },
        include: memberInclude,
      }),
    );
  }

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMemberWithUser> {
    return this.prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
      include: memberInclude,
    });
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await this.prisma.organizationMember.deleteMany({ where: { organizationId, userId } });
  }
}

async function nullOnUniqueViolation<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return null;
    throw err;
  }
}
