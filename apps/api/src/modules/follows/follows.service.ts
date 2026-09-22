import { BadRequestException,Injectable,NotFoundException } from "@nestjs/common";
import type { PublicUserDto } from "@lt/shared";
import { UsersRepository } from "../users/users.repository.js";
import { toPublicUserDto } from "../users/users.mapper.js";
import { FollowsRepositoty } from "./follows.repository.js";

@Injectable()
export class FollowsService{
    constructor(
        private readonly follows: FollowsRepositoty,
        private readonly users:UsersRepository,
    ){}

    async follow(followerId:string,followingId:string):Promise<void>{

        if(followerId === followingId){
            throw new BadRequestException('自分自身はフォローできません');
        }

        const target = await this.users.findById(followingId);

        if(!target){
            throw new NotFoundException('ユーザが見つかりません');
        }

        await this.follows.upsertFollow(followerId,followingId);
    }

    async unfollow(followerId:string,followingId:string):Promise<void>{
        await this.follows.deleteFollow(followerId,followingId);
    }

    async isFollowing(followerId:string,followingId:string):Promise<boolean>{
        return this.follows.exists(followerId,followingId);
    }

    async listFollowers(userId:string):Promise<PublicUserDto[]>{
        const rows = await this.follows.findFollowers(userId);
        return rows.map((row) => toPublicUserDto(row.follower));
    }

    async listFollowing(userId:string):Promise<PublicUserDto[]>{
        const rows = await this.follows.findFollowing(userId);
        return rows.map((row) => toPublicUserDto(row.following));
    }
}