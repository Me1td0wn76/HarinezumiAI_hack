import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

// 見出し・ボタンなど強調用のフォント。CSS変数 --font-nunito として globals.css の --font-display から参照する。
// weight を固定値の配列で指定すると静的ウェイトごとに別ファイルを取得するため、
// 可変フォント1本だけで済む "variable" を使ってダウンロード量を減らす
const nunito = Nunito({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-nunito",
  display: "swap",
});

// 本文用のフォント。CSS変数 --font-dm-sans として globals.css の --font-body から参照する
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-dm-sans",
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
    <html lang="ja" className={`h-full antialiased ${nunito.variable} ${dmSans.variable}`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Nav />
        {/*
          ここでは幅・余白を持たせない。トップページのヒーローのように画面幅いっぱいの背景を
          敷きたいページがあるため、中央寄せ・最大幅・左右余白は各ページ（が持つコンテナ）側で指定する。
          以前は max-w-4xl px-4 py-8 をここに置き、トップページ側で負のマージンで打ち消していたが、
          896px（max-w-4xl）を超える画面幅では黄色い帯が中央の箱になってしまう不具合があったため撤去した。
        */}
        <main className="flex-1">{children}</main>
        <footer className="border-t border-card-border px-4 py-4 text-center text-xs text-subtle">
          LT会支援アプリ
        </footer>
      </body>
    </html>
  );
}
