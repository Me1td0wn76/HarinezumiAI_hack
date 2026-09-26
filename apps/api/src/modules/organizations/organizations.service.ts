import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ORGANIZATION_SLUG_PATTERN,
  type MyOrganizationDto,
  type OrganizationDetailDto,
  type OrganizationListItemDto,
  type OrganizationMemberDto,
} from '@lt/shared';
import type { Organization, User } from '../../generated/prisma/client.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { OrganizationsRepository } from './organizations.repository.js';
import {
  toMyOrganizationDto,
  toOrganizationDetailDto,
  toOrganizationListItemDto,
  toOrganizationMemberDto,
} from './organizations.mapper.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { AddOrganizationMemberDto, UpdateOrganizationMemberDto } from './dto/member.dto.js';

const SLUG_TAKEN = 'この ID はすでに使われています';

/**
 * 団体。参加は招待制で、OWNER がハンドルを指定してメンバーを追加する（本人はいつでも抜けられる）。
 * 自由参加にすると、誰でも団体名義のLT会を立てて団体の Discord に通知を流せてしまうため（docs/open-questions.md G-1）
 */
@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizations: OrganizationsRepository,
    private readonly users: UsersRepository,
    private readonly blocks: BlocksRepository,
  ) {}

  async list(): Promise<OrganizationListItemDto[]> {
    const orgs = await this.organizations.findRecent();
    return orgs.map(toOrganizationListItemDto);
  }

  async listMine(user: User): Promise<MyOrganizationDto[]> {
    const memberships = await this.organizations.findManyByMember(user.id);
    return memberships.map(toMyOrganizationDto);
  }

  async getBySlug(rawSlug: string, viewer: User | null): Promise<OrganizationDetailDto> {
    const slug = rawSlug.toLowerCase();
    // 形式に合わない slug は存在し得ないので DB に問い合わせない
    const org = ORGANIZATION_SLUG_PATTERN.test(slug) ? await this.organizations.findDetailBySlug(slug) : null;
    if (!org) throw new NotFoundException('団体が見つかりません');
    return toOrganizationDetailDto(org, viewer?.id ?? null);
  }

  /** 作成者が OWNER になる */
  async create(user: User, dto: CreateOrganizationDto): Promise<OrganizationDetailDto> {
    const org = await this.organizations.create(
      {
        name: dto.name.trim(),
        slug: dto.slug,
        description: dto.description?.trim() || null,
        webhookUrl: dto.webhookUrl || null,
      },
      user.id,
    );
    if (!org) throw new ConflictException(SLUG_TAKEN);
    return this.getBySlug(org.slug, user);
  }

  async update(rawSlug: string, user: User, dto: UpdateOrganizationDto): Promise<OrganizationDetailDto> {
    const org = await this.findOwnedOrThrow(rawSlug, user);
    const updated = await this.organizations.update(org.id, {
      name: dto.name?.trim(),
      slug: dto.slug,
      // undefined は変更なし、null / 空文字は解除
      description: dto.description === undefined ? undefined : dto.description?.trim() || null,
      webhookUrl: dto.webhookUrl === undefined ? undefined : dto.webhookUrl || null,
    });
    if (!updated) throw new ConflictException(SLUG_TAKEN);
    return this.getBySlug(updated.slug, user);
  }

  /** 紐付いていたLT会は消さずに団体なしにする */
  async remove(rawSlug: string, user: User): Promise<void> {
    const org = await this.findOwnedOrThrow(rawSlug, user);
    await this.organizations.delete(org.id);
  }

  /** OWNER がハンドルでメンバーを追加する */
  async addMember(rawSlug: string, user: User, dto: AddOrganizationMemberDto): Promise<OrganizationMemberDto> {
    const org = await this.findOwnedOrThrow(rawSlug, user);
    const target = await this.users.findByHandle(dto.handle);
    // 相手にブロックされている場合も「見つからない」と同じ扱いにする（ブロックされたことを知らせない）
    if (!target || (await this.blocks.findBlockedIds(target.id)).includes(user.id)) {
      throw new NotFoundException('ユーザーが見つかりません');
    }
    const member = await this.organizations.addMember(org.id, target.id, dto.role ?? 'MEMBER');
    if (!member) throw new ConflictException('すでにメンバーです');
    return toOrganizationMemberDto(member);
  }

  /** OWNER が役割を変える。最後の OWNER は MEMBER にできない */
  async updateMember(
    rawSlug: string,
    user: User,
    targetUserId: string,
    dto: UpdateOrganizationMemberDto,
  ): Promise<OrganizationMemberDto> {
    const org = await this.findOwnedOrThrow(rawSlug, user);
    const currentRole = await this.organizations.findRole(org.id, targetUserId);
    if (!currentRole) throw new NotFoundException('メンバーが見つかりません');
    if (currentRole === 'OWNER' && dto.role !== 'OWNER') await this.assertNotLastOwner(org.id);
    const member = await this.organizations.updateMemberRole(org.id, targetUserId, dto.role);
    return toOrganizationMemberDto(member);
  }

  /** OWNER はメンバーを外せる。本人は自分で抜けられる。最後の OWNER は抜けられない */
  async removeMember(rawSlug: string, user: User, targetUserId: string): Promise<void> {
    const org = await this.findOrThrow(rawSlug);
    const viewerRole = await this.organizations.findRole(org.id, user.id);
    if (targetUserId !== user.id && viewerRole !== 'OWNER') {
      throw new ForbiddenException('オーナーのみ操作できます');
    }
    const targetRole = targetUserId === user.id ? viewerRole : await this.organizations.findRole(org.id, targetUserId);
    if (!targetRole) throw new NotFoundException('メンバーが見つかりません');
    if (targetRole === 'OWNER') await this.assertNotLastOwner(org.id);
    await this.organizations.removeMember(org.id, targetUserId);
  }

  private async findOrThrow(rawSlug: string): Promise<Organization> {
    const slug = rawSlug.toLowerCase();
    const org = ORGANIZATION_SLUG_PATTERN.test(slug) ? await this.organizations.findBySlug(slug) : null;
    if (!org) throw new NotFoundException('団体が見つかりません');
    return org;
  }

  private async findOwnedOrThrow(rawSlug: string, user: User): Promise<Organization> {
    const org = await this.findOrThrow(rawSlug);
    if ((await this.organizations.findRole(org.id, user.id)) !== 'OWNER') {
      throw new ForbiddenException('オーナーのみ操作できます');
    }
    return org;
  }

  /**
   * OWNER が1人もいない団体は誰も管理できなくなるので作らない。
   * 2人の OWNER が同時に互いを外すと 0 人になり得るが、頻度が低いので許容する（その場合は運営が DB で対応する）
   */
  private async assertNotLastOwner(organizationId: string): Promise<void> {
    if ((await this.organizations.countOwners(organizationId)) <= 1) {
      throw new BadRequestException(
        'オーナーが1人もいなくなるため操作できません。先に別のメンバーをオーナーにするか、団体を削除してください',
      );
    }
  }
}
