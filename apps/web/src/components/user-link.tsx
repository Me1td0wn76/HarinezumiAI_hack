import type { PublicUserDto } from "@lt/shared";
import Link from "next/link";
import { Avatar } from "./avatar";

/** アバター + 表示名。公開プロフィール（/users/[handle]）へのリンク */
export function UserLink({ user, className = "" }: { user: PublicUserDto; className?: string }) {
  return (
    <Link
      href={`/users/${user.handle}`}
      className={`inline-flex min-w-0 items-center gap-1.5 hover:text-foreground hover:underline ${className}`}
    >
      <Avatar user={user} />
      <span className="truncate">{user.displayName}</span>
    </Link>
  );
}
