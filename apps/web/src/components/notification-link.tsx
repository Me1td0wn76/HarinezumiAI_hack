"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { markNotificationRead } from "@/actions/notifications";

/**
 * 通知1件分のリンク。普通のリンクとして動く（中クリック・Ctrl+クリックで別タブ、リンクのコピー等）うえで、
 * 開いたときに未読なら裏で既読にする
 */
export function NotificationLink({
  id,
  href,
  unread,
  className,
  children,
}: {
  id: string;
  href: string;
  unread: boolean;
  className: string;
  children: ReactNode;
}) {
  const markRead = () => {
    if (unread) void markNotificationRead(id);
  };
  // 中クリック（別タブで開く）は click ではなく auxclick で届く
  const onAuxClick = (e: MouseEvent) => {
    if (e.button === 1) markRead();
  };

  return (
    <Link href={href} className={className} onClick={markRead} onAuxClick={onAuxClick}>
      {children}
    </Link>
  );
}
