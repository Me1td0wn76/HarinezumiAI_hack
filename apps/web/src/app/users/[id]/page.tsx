import type { UserProfileDto } from "@lt/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default async function UserProfilePage(props:PageProps<"/users/[id]">)
{
    const {id} = await props.params;

    const [profile, me] = await Promise.all([
        apiFetch<UserProfileDto>(`/users/${id}`).catch((err) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
        throw err;
        }),
        getCurrentUser(),
    ]);

    if (!profile) notFound();

    const isOwnProfile = me?.id === id;

    return (
        <div className="mx-auto max-w-md space-y-4 px-4 py-8">
        <h1 className="text-xl font-bold">{profile.displayName}</h1>
        {profile.bio && <p className="whitespace-pre-wrap text-sm text-stone-600">{profile.bio}</p>}
        <p className="text-sm text-stone-500">
            フォロワー {profile.followerCount} ・ フォロー中 {profile.followingCount}
        </p>

        {!isOwnProfile && me && <FollowButton targetUserId={id} initialIsFollowing={profile.isFollowing} />}
        {!me && <p className="text-sm text-stone-600">フォローするにはログインしてください。</p>}

        {profile.organizedEvents.length > 0 && (
            <section className="card space-y-2">
            <h2 className="font-bold">主催したLT会</h2>
            <ul className="space-y-1">
                {profile.organizedEvents.map((event) => (
                <li key={event.id}>
                    <Link href={`/events/${event.id}`} className="text-success-foreground font-medium underline hover:text-success transition">
                    {event.title}
                    </Link>
                </li>
                ))}
            </ul>
            </section>
        )}
        </div>
    );
}