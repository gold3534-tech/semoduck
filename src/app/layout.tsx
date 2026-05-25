import type { Metadata } from "next";
import { PropsWithChildren } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "세모덕 Semoduck",
  description: "세상의 모든 덕질을 모으는 팬덤 커뮤니티 플랫폼",
  icons: {
    icon: "/semoduck-icon.png",
    shortcut: "/semoduck-icon.png",
    apple: "/semoduck-icon.png"
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-14 pt-4 sm:px-5">{children}</main>
      </body>
    </html>
  );
}
