import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsRepository, type OrganizationDetail } from './organizations.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { BlocksRepository } from '../blocks/blocks.repository.js';
import { buildUser } from '../../test-support/event-factories.js';

const owner = buildUser({ id: 'owner', handle: 'owner' });
const member = buildUser({ id: 'member', handle: 'member' });
const stranger = buildUser({ id: 'stranger', handle: 'stranger' });

const org = {
  id: 'org-1',
  slug: 'my-lab',
  name: '研究室',
  description: null,
  webhookUrl: 'https://discord.com/api/webhooks/1/secret',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function buildDetail(): OrganizationDetail {
  const joinedAt = new Date('2026-01-01T00:00:00.000Z');
  return {
    ...org,
    _count: { members: 2 },
    members: [
      {
        organizationId: org.id,
        userId: owner.id,
        role: 'OWNER',
        createdAt: joinedAt,
        user: { id: owner.id, handle: owner.handle, displayName: owner.displayName, avatarUrl: null },
      },
      {
        organizationId: org.id,
        userId: member.id,
        role: 'MEMBER',
        createdAt: joinedAt,
        user: { id: member.id, handle: member.handle, displayName: member.displayName, avatarUrl: null },
      },
    ],
  };
}

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repo: Record<
    | 'findBySlug'
    | 'findDetailBySlug'
    | 'findRole'
    | 'countOwners'
    | 'create'
    | 'update'
    | 'delete'
    | 'addMember'
    | 'updateMemberRole'
    | 'removeMember',
    ReturnType<typeof vi.fn>
  >;
  let users: { findByHandle: ReturnType<typeof vi.fn> };
  let blocks: { findBlockedIds: ReturnType<typeof vi.fn> };
  const roles: Record<string, 'OWNER' | 'MEMBER'> = {};

  beforeEach(async () => {
    Object.assign(roles, { owner: 'OWNER', member: 'MEMBER' });
    delete roles.stranger;
    repo = {
      findBySlug: vi.fn().mockResolvedValue(org),
      findDetailBySlug: vi.fn().mockResolvedValue(buildDetail()),
      findRole: vi.fn((_orgId: string, userId: string) => Promise.resolve(roles[userId] ?? null)),
      countOwners: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      addMember: vi.fn(),
      updateMemberRole: vi.fn(),
      removeMember: vi.fn(),
    };
    users = { findByHandle: vi.fn() };
    blocks = { findBlockedIds: vi.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: repo },
        { provide: UsersRepository, useValue: users },
        { provide: BlocksRepository, useValue: blocks },
      ],
    }).compile();
    service = moduleRef.get(OrganizationsService);
  });

  describe('getBySlug', () => {
    it('webhookUrl は OWNER にだけ返す', async () => {
      expect((await service.getBySlug('my-lab', owner)).webhookUrl).toBe(org.webhookUrl);
      expect((await service.getBySlug('my-lab', member)).webhookUrl).toBeNull();
      expect((await service.getBySlug('my-lab', null)).webhookUrl).toBeNull();
    });

    it('閲覧者の役割を返す（非メンバー・未ログインは null）', async () => {
      expect((await service.getBySlug('my-lab', member)).viewerRole).toBe('MEMBER');
      expect((await service.getBySlug('my-lab', stranger)).viewerRole).toBeNull();
    });

    it('形式に合わない slug は DB に問い合わせずに 404', async () => {
      await expect(service.getBySlug('-bad-', null)).rejects.toThrow(NotFoundException);
      expect(repo.findDetailBySlug).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('作成者を OWNER にし、空の説明・Webhook は null で保存する', async () => {
      repo.create.mockResolvedValue(org);
      await service.create(owner, { name: ' 研究室 ', slug: 'my-lab', description: ' ', webhookUrl: '' });
      expect(repo.create).toHaveBeenCalledWith(
        { name: '研究室', slug: 'my-lab', description: null, webhookUrl: null },
        owner.id,
      );
    });

    it('slug が使用済みなら 409', async () => {
      repo.create.mockResolvedValue(null);
      await expect(service.create(owner, { name: '研究室', slug: 'my-lab' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update / remove', () => {
    it('OWNER 以外は 403', async () => {
      await expect(service.update('my-lab', member, { name: '新' })).rejects.toThrow(ForbiddenException);
      await expect(service.remove('my-lab', stranger)).rejects.toThrow(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('OWNER は削除できる', async () => {
      await service.remove('my-lab', owner);
      expect(repo.delete).toHaveBeenCalledWith(org.id);
    });
  });

  describe('addMember', () => {
    it('OWNER 以外はメンバーを追加できない（招待制）', async () => {
      await expect(service.addMember('my-lab', member, { handle: 'stranger' })).rejects.toThrow(ForbiddenException);
      expect(repo.addMember).not.toHaveBeenCalled();
    });

    it('ハンドルで追加する。役割の省略時は MEMBER', async () => {
      users.findByHandle.mockResolvedValue(stranger);
      repo.addMember.mockResolvedValue({
        organizationId: org.id,
        userId: stranger.id,
        role: 'MEMBER',
        createdAt: new Date(),
        user: { id: stranger.id, handle: stranger.handle, displayName: stranger.displayName, avatarUrl: null },
      });
      const result = await service.addMember('my-lab', owner, { handle: 'stranger' });
      expect(repo.addMember).toHaveBeenCalledWith(org.id, stranger.id, 'MEMBER');
      expect(result.user.handle).toBe('stranger');
    });

    it('相手にブロックされていると、存在しないユーザーと同じく 404', async () => {
      users.findByHandle.mockResolvedValue(stranger);
      blocks.findBlockedIds.mockResolvedValue([owner.id]);
      await expect(service.addMember('my-lab', owner, { handle: 'stranger' })).rejects.toThrow(NotFoundException);
      expect(repo.addMember).not.toHaveBeenCalled();
    });

    it('すでにメンバーなら 409', async () => {
      users.findByHandle.mockResolvedValue(member);
      repo.addMember.mockResolvedValue(null);
      await expect(service.addMember('my-lab', owner, { handle: 'member' })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMember', () => {
    it('最後の OWNER を MEMBER にはできない（400）', async () => {
      await expect(service.updateMember('my-lab', owner, owner.id, { role: 'MEMBER' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.updateMemberRole).not.toHaveBeenCalled();
    });

    it('OWNER が2人以上いれば MEMBER にできる', async () => {
      repo.countOwners.mockResolvedValue(2);
      repo.updateMemberRole.mockResolvedValue(buildDetail().members[0]);
      await service.updateMember('my-lab', owner, owner.id, { role: 'MEMBER' });
      expect(repo.updateMemberRole).toHaveBeenCalledWith(org.id, owner.id, 'MEMBER');
    });

    it('メンバーでない相手は 404', async () => {
      await expect(service.updateMember('my-lab', owner, stranger.id, { role: 'OWNER' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeMember', () => {
    it('本人は自分で抜けられる', async () => {
      await service.removeMember('my-lab', member, member.id);
      expect(repo.removeMember).toHaveBeenCalledWith(org.id, member.id);
    });

    it('MEMBER は他人を外せない（403）', async () => {
      roles.stranger = 'MEMBER';
      await expect(service.removeMember('my-lab', member, stranger.id)).rejects.toThrow(ForbiddenException);
      expect(repo.removeMember).not.toHaveBeenCalled();
    });

    it('OWNER はメンバーを外せる', async () => {
      await service.removeMember('my-lab', owner, member.id);
      expect(repo.removeMember).toHaveBeenCalledWith(org.id, member.id);
    });

    it('最後の OWNER は抜けられない（400）', async () => {
      await expect(service.removeMember('my-lab', owner, owner.id)).rejects.toThrow(BadRequestException);
      expect(repo.removeMember).not.toHaveBeenCalled();
    });

    it('メンバーでない人が自分を外そうとすると 404', async () => {
      await expect(service.removeMember('my-lab', stranger, stranger.id)).rejects.toThrow(NotFoundException);
    });
  });
});
