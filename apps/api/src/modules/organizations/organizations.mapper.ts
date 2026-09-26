import type {
  MyOrganizationDto,
  OrganizationDetailDto,
  OrganizationListItemDto,
  OrganizationMemberDto,
  OrganizationSummaryDto,
} from '@lt/shared';
import { toPublicUserDto } from '../users/users.mapper.js';
import type {
  MyOrganization,
  OrganizationDetail,
  OrganizationListItem,
  OrganizationMemberWithUser,
  OrganizationSummary,
} from './organizations.repository.js';

export function toOrganizationSummaryDto(org: OrganizationSummary): OrganizationSummaryDto {
  return { id: org.id, slug: org.slug, name: org.name };
}

export function toOrganizationListItemDto(org: OrganizationListItem): OrganizationListItemDto {
  return { ...toOrganizationSummaryDto(org), description: org.description, memberCount: org._count.members };
}

export function toOrganizationMemberDto(member: OrganizationMemberWithUser): OrganizationMemberDto {
  return { user: toPublicUserDto(member.user), role: member.role, joinedAt: member.createdAt.toISOString() };
}

export function toMyOrganizationDto(member: MyOrganization): MyOrganizationDto {
  return { ...toOrganizationSummaryDto(member.organization), role: member.role };
}

/** @param viewerId 閲覧者。OWNER のときだけ webhookUrl を含める */
export function toOrganizationDetailDto(org: OrganizationDetail, viewerId: string | null): OrganizationDetailDto {
  const viewerRole = org.members.find((m) => m.userId === viewerId)?.role ?? null;
  return {
    ...toOrganizationListItemDto(org),
    members: org.members.map(toOrganizationMemberDto),
    viewerRole,
    webhookUrl: viewerRole === 'OWNER' ? org.webhookUrl : null,
    createdAt: org.createdAt.toISOString(),
  };
}
