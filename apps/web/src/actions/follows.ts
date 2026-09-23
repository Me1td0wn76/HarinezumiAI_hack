'use server'

import { revalidatePath } from "next/cache"
import { apiFetch,errorMessage } from "@/lib/api"
import type { ActionState } from './types';
import{str}from './form'

/** ActionState に isFollowing を足しただけ。ActionState 側の変更に追従できるよう派生させる */
export type FollowActionState = (NonNullable<ActionState> & { isFollowing?: boolean }) | undefined;

/**
 * フォロー/フォロー解除を1つのActionで扱う
 * hidden input の isFollowing (現在の状態)を見て、POST/DELETEを切り替える。
 */
export async function toggleFollow(_prev:FollowActionState,formData:FormData):Promise<FollowActionState>{
    const targetUserId = str(formData,'targetUserId');
    const currentlyFollowing = str(formData,'isFollowing') === 'true'

    try{
        if(currentlyFollowing)
        {
            await apiFetch(`/users/${targetUserId}/follow`,{method:'DELETE'});
        }else{
            await apiFetch(`/users/${targetUserId}/follow`,{method:'POST'});
        }
    }catch(err){
        // 失敗時は状態を変えず、元のisFollowingのままエラーだけ返す
        return { error: errorMessage(err), isFollowing: currentlyFollowing };
    }

    revalidatePath(`/users/${targetUserId}`);
    return{isFollowing:!currentlyFollowing};
}
