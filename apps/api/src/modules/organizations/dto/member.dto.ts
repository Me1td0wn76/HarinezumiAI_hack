import {
  ORGANIZATION_ROLE,
  type AddOrganizationMemberRequest,
  type OrganizationRole,
  type UpdateOrganizationMemberRequest,
} from '@lt/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddOrganizationMemberDto implements AddOrganizationMemberRequest {
  /** 先頭の @ は付けても付けなくてもよい */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/^@/, '').toLowerCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  handle: string;

  @IsOptional()
  @IsIn(ORGANIZATION_ROLE)
  role?: OrganizationRole;
}

export class UpdateOrganizationMemberDto implements UpdateOrganizationMemberRequest {
  @IsIn(ORGANIZATION_ROLE)
  role: OrganizationRole;
}
