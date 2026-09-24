import type { ReactNode } from "react";

/** 利用規約・プライバシーポリシーの共通レイアウト */
export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">{title}</h1>
        <p className="text-xs text-subtle">最終更新日: {updatedAt}</p>
      </div>
      <div className="card space-y-6 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
        {children}
      </div>
    </div>
  );
}
