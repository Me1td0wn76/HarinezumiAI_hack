import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { Follow } from '../../generated/prisma/client.js'

const PUBLIC_USER_SELECT = {id:true,displayName:true} as const;

type PublicUserRow = { id:string;displayName:string};

@Injectable()
export class FollowsRepository{
    constructor(private readonly prisma:PrismaService){}

    /** フォローする */
    upsertFollow(followerId:string,followingId:string):Promise<Follow>{
        return this.prisma.follow.upsert({
            where:{followerId_followingId:{followerId,followingId}},
            create:{followerId,followingId},
            update:{},
        });
    }

    /** フォロー解除 */
    async deleteFollow(followerId:string,followingId:string):Promise<void>{
        await this.prisma.follow.deleteMany({
            where:{followerId,followingId},
        });
    }

    async exists(followerId:string,followingId:string):Promise<boolean>{
        const found = await this.prisma.follow.findUnique({
            where:{followerId_followingId:{followerId,followingId}},
            select:{id:true},
        });;
        return found !== null;
    }

    /** userId をフォローしている人たち */
    findFollowers(userId: string): Promise<Array<{ follower: PublicUserRow }>> {
        return this.prisma.follow.findMany({
        where: { followingId: userId },
        select: { follower: { select: PUBLIC_USER_SELECT } },
        orderBy: { createdAt: 'desc' },
        });
    }

    /** userId がフォローしている人たち */
    findFollowing(userId: string): Promise<Array<{ following: PublicUserRow }>> {
        return this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { following: { select: PUBLIC_USER_SELECT } },
        orderBy: { createdAt: 'desc' },
        });
    }
}