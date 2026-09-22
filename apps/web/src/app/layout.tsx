import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

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
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-400">
          LT会支援アプリ
        </footer>
      </body>
    </html>
  );
}
