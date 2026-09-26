import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../common/throttle.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { AddOrganizationMemberDto, UpdateOrganizationMemberDto } from './dto/member.dto.js';

/** 団体に紐付いたLT会の一覧（GET /organizations/:slug/events）は EventsModule の OrganizationEventsController */
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  /** 新しい順 */
  @Get()
  list() {
    return this.organizations.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle(THROTTLE.createOrganization)
  create(@CurrentUser() user: User, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(user, dto);
  }

  /** 公開。OWNER がログインして見た場合のみ webhookUrl が含まれる */
  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  detail(@Param('slug') slug: string, @CurrentUser() user: User | null) {
    return this.organizations.getBySlug(slug, user);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  update(@Param('slug') slug: string, @CurrentUser() user: User, @Body() dto: UpdateOrganizationDto) {
    return this.organizations.update(slug, user, dto);
  }

  @Delete(':slug')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  remove(@Param('slug') slug: string, @CurrentUser() user: User) {
    return this.organizations.remove(slug, user);
  }

  @Post(':slug/members')
  @UseGuards(JwtAuthGuard)
  addMember(@Param('slug') slug: string, @CurrentUser() user: User, @Body() dto: AddOrganizationMemberDto) {
    return this.organizations.addMember(slug, user, dto);
  }

  @Patch(':slug/members/:userId')
  @UseGuards(JwtAuthGuard)
  updateMember(
    @Param('slug') slug: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateOrganizationMemberDto,
  ) {
    return this.organizations.updateMember(slug, user, userId, dto);
  }

  /** OWNER がメンバーを外す、または本人が抜ける */
  @Delete(':slug/members/:userId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  removeMember(@Param('slug') slug: string, @Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() user: User) {
    return this.organizations.removeMember(slug, user, userId);
  }
}
