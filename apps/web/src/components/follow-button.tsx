"use client";

import { useActionState } from "react";
import { toggleFollow } from "@/actions/follows";
import { FormMessage } from "./form-message";

export function FollowButton({
  targetUserId,
  initialIsFollowing,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
}) {
  const [state, action, pending] = useActionState(toggleFollow, undefined);
  const isFollowing = state?.isFollowing ?? initialIsFollowing;

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="isFollowing" value={String(isFollowing)} />
      <button type="submit" className={isFollowing ? "btn-secondary text-xs" : "btn-primary text-xs"} disabled={pending}>
        {pending ? "処理中…" : isFollowing ? "フォロー中" : "フォローする"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
