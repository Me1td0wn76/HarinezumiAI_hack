import { Body, Controller, Get,Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user, dto);
  }

  /** 他人のプロフィールページ用。ログイン不要で見られるが、ログインしていれば isFollowing も返す */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getPublicProfile(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() viewer: User | null) {
    return this.usersService.getPublicProfile(id, viewer);
  }
}
