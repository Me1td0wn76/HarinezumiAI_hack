import { Controller,Delete,Get,HttpCode,Param,ParseUUIDPipe,Post,UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import type { User } from "../../generated/prisma/client.js";
import { FollowsService } from './follows.service.js';

@Controller('users')
export class FollowsController{
    constructor(private readonly followsService: FollowsService){}

    @Post(':id/follow')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    follow(@CurrentUser() user:User,@Param('id',ParseUUIDPipe) targetId:string){
        return this.followsService.follow(user.id,targetId);
    }

    @Delete(':id/follow')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    unfollow(@CurrentUser() user:User,@Param('id',ParseUUIDPipe)targetId:string){
        return this.followsService.unfollow(user.id,targetId);
    }

    /** フォロワー */
    @Get(':id/followers')
    followers(@Param('id',ParseUUIDPipe)targetId:string){
        return this.followsService.listFollowers(targetId);
    }

    /** フォロー中のユーザ */
    @Get(':id/following')
    following(@Param('id',ParseUUIDPipe)targetId:string){
        return this.followsService.listFollowing(targetId);
    }
}