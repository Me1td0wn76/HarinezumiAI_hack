import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { OrganizationsService } from './organizations.service.js';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class MyOrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  /** 自分が所属する団体。LT会作成フォームの選択肢に使う */
  @Get('organizations')
  list(@CurrentUser() user: User) {
    return this.organizations.listMine(user);
  }
}
