import type { PublicUserDto } from "@lt/shared";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { ApiError,apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default async function UserPofilePage(props:PageProps<"/users/[id]">)
{
    const {id} = await props.params;

    let profile:PublicUserDto;
    try{
        profile = await apiFetch<PublicUserDto>(`/users/${id}`,{auth:false});
    }catch(err){
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
        throw err;
    }

    const [me,followers,following] = await Promise.all([
        getCurrentUser(),
        apiFetch<PublicUserDto[]>(`/users/${id}/followers`,{auth:false}),
        apiFetch<PublicUserDto[]>(`/users/${id}/following`,{auth:false}),
    ]);

    const isOwnProfile = me?.id === id;
    const isFollowing = !isOwnProfile && me ? (await apiFetch<{isFollowing:boolean}>(`/users/${id}/follow-status`)).isFollowing:false;

    return (
        <div className = "mx-auto max-w-md space-y-4 px-4 py-8">
            <h1 className="text-xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-stone-500">
                フォロワー {followers.length} ・ フォロー中{following.length}
            </p>

            {!isOwnProfile && me && <FollowButton targetUserId = {id} initialIsFollowing={isFollowing}/>}
            {!me && <p className="text-sm text-stone-600">フォローするにはログインしてください。</p>}
        </div>
    );
}