import type { Metadata } from "next";
import { PropsWithChildren } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "세모덕 Semoduck",
  description: "세상의 모든 덕질을 모으는 팬덤 커뮤니티 플랫폼",
  icons: {
    icon: "/semoduck-icon.svg",
    shortcut: "/semoduck-icon.svg",
    apple: "/semoduck-icon.svg"
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
