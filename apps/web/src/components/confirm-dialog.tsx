"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * 取り消しにくい操作の前に出す確認モーダル。ネイティブの <dialog> を showModal() で開くので、
 * フォーカスの閉じ込め・Esc で閉じる・背景の操作不可・閉じた後のフォーカス復帰はブラウザに任せられる。
 *
 * マウントされている間だけ開く（開閉は親が条件付きレンダリングで決める）。
 * 親は `key` を変えて毎回作り直すと、前回のエラー表示などが残らない。
 * 確定ボタンは form の submit なので、`action` に Server Function（useActionState の dispatch）を渡す。
 */
export function ConfirmDialog({
  title,
  children,
  action,
  hiddenFields,
  confirmLabel,
  pendingLabel = "処理中…",
  pending = false,
  onClose,
}: {
  title: string;
  /** 本文。確定すると何が起きるかを書く */
  children: ReactNode;
  action: (formData: FormData) => void;
  /** action に渡す hidden input など */
  hiddenFields?: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  /** 送信中は閉じられないようにし、ボタンを無効にする */
  pending?: boolean;
  /** キャンセル・Esc・背景クリックで閉じたとき */
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  // <dialog> のモーダル表示は DOM の命令的な API でしか開けないため、マウント時に effect で開く
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // 押し間違いで確定しないよう、最初のフォーカスは安全な「キャンセル」に置く
    cancelRef.current?.focus();
  }, []);

  const close = () => {
    if (!pending) dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // Esc（cancel イベント）でも、送信中は閉じない
      onCancel={(e) => {
        if (pending) e.preventDefault();
      }}
      // Esc・キャンセル・背景クリックのどれで閉じても close イベントに集約して親へ伝える
      onClose={onClose}
      // 背景（::backdrop）のクリックは dialog 要素自身へのクリックとして届く。中身は内側の form が受ける
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md overscroll-contain rounded-[1.25rem] border-[1.5px] border-card-border bg-card p-0 text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop:bg-foreground/40"
    >
      <form action={action} className="space-y-4 p-5">
        {hiddenFields}
        <h2 id={titleId} className="font-display text-lg font-extrabold text-foreground">
          {title}
        </h2>
        <div id={bodyId} className="space-y-3 text-sm text-foreground">
          {children}
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button ref={cancelRef} type="button" className="btn-secondary text-xs" onClick={close} disabled={pending}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary text-xs" disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}