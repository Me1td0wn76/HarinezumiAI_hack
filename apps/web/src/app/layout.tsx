import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import Link from "next/link";
import { CardTilt } from "@/components/card-tilt";
import { ClickRipples, EffectsToggle } from "@/components/click-effects";
import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

// 見出し・本文とも同じ書体。CSS変数 --font-zen として globals.css の --font-display / --font-body から参照する。
// 和文の字形はページで使った文字の分だけ（unicode-range ごとに）読み込まれるので、先読みするのは英数字（latin）だけにする
const zen = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-zen",
  display: "swap",
});

export const metadata: Metadata = {
  // OGP などの相対URL をこのオリジンで絶対URL にする
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"),
  title: {
    default: "LT会支援アプリ",
    template: "%s | LT会支援",
  },
  description: "LT会を気軽に立てて、見つけて、参加できるサービス",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`h-full antialiased ${zen.variable}`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Nav />
        {/*
          ここでは幅・余白を持たせない。ページ上部の黄色い帯のように画面幅いっぱいの背景を
          敷きたいページがあるため、中央寄せ・最大幅・左右余白は各ページ（が持つコンテナ）側で指定する。
        */}
        {/* 波紋や逃げる図形が画面の端からはみ出しても横スクロールが出ないよう、横方向だけ切る（clip はスクロール領域を作らない） */}
        <main className="flex-1 overflow-x-clip">{children}</main>
        <footer className="bg-sunny px-4 py-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-sm font-bold">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="font-display text-base font-black">LT会支援</span>
              <Link href="/events" className="hover:underline">
                LT会を探す
              </Link>
              <Link href="/calendar?view=all" className="hover:underline">
                カレンダー
              </Link>
              <Link href="/terms" className="hover:underline">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:underline">
                プライバシーポリシー
              </Link>
            </div>
            <EffectsToggle />
          </div>
        </footer>
        {/* 演出（どれも「動きの演出」OFF と OS の「視差効果を減らす」設定で止まる） */}
        <ClickRipples />
        <CardTilt />
        <PageTransition />
      </body>
    </html>
  );
}
