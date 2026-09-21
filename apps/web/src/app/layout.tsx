import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "LT会支援アプリ",
  description: "学内LT会の開催と日程調整を支援するアプリ",
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
