import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

// 見出し・ボタンなど強調用のフォント。CSS変数 --font-nunito として globals.css の --font-display から参照する
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

// 本文用のフォント。CSS変数 --font-dm-sans として globals.css の --font-body から参照する
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LT会支援アプリ",
  description: "LT会を気軽に立てて、見つけて、参加できるサービス",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`h-full antialiased ${nunito.variable} ${dmSans.variable}`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-card-border py-4 text-center text-xs text-subtle">
          LT会支援アプリ
        </footer>
      </body>
    </html>
  );
}
