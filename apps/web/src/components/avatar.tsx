import type { PublicUserDto } from "@lt/shared";
import Image from "next/image";

/** アバター未設定のときに出す画像。ハンドルから毎回同じ絵柄が作られる（DiceBear） */
function generatedAvatarUrl(handle: string): string {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(handle)}`;
}

/**
 * ユーザーのアバター。隣に表示名を出す前提なので alt は空（読み上げの重複を避ける）。
 * 利用者が指定した任意のドメインの画像なので、最適化（remotePatterns の許可が要る）は通さず、そのまま読み込む。
 * 閲覧ページの URL を画像の配信元に渡さないよう Referer は送らない
 * @param preload ファーストビューに出る大きなアバター（プロフィールページ）だけ先読みする
 */
export function Avatar({
  user,
  size = 24,
  preload = false,
}: {
  user: Pick<PublicUserDto, "handle" | "avatarUrl">;
  size?: number;
  preload?: boolean;
}) {
  return (
    <Image
      src={user.avatarUrl ?? generatedAvatarUrl(user.handle)}
      alt=""
      width={size}
      height={size}
      unoptimized
      preload={preload}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-full border border-card-border bg-muted object-cover"
      style={{ width: size, height: size }}
    />
  );
}
