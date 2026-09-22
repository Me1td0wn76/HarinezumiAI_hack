'use server'

import { revalidatePath } from "next/cache"
import { apiFetch,errorMessage } from "@/lib/api"
import{str}from './form'

export type FollowActionState = {error?:string;isFollowing?:boolean} | undefined;

/**
 * フォロー/フォロー解除を1つのActionで扱う
 * hidden input の isFollowing (現在の状態)を見て、POST/DELETEを切り替える。
 */
export async function toggleFollow(_prev:FollowActionState,formData:FormData):Promise<FollowActionState>{
    const targetUserId = str(formData,'targetUserId');
    const currentlyFollowing = str(formData,'isFollowing') === 'true'

    console.log('[toggleFollow]', { targetUserId, currentlyFollowing });

    try{
        if(currentlyFollowing)
        {
            await apiFetch(`/users/${targetUserId}/follow`,{method:'DELETE'});
        }else{
            await apiFetch(`/users/${targetUserId}/follow`,{method:'POST'});
        }
    }catch(err){
        return {error:errorMessage(err),isFollowing:currentlyFollowing};
    }

    revalidatePath(`/users/${targetUserId}`);
    return{isFollowing:!currentlyFollowing};
}