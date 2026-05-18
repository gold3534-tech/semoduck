"use client";

import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/layout/auth-button";
import { isAdminEmail } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const defaultNav = [
  ["홈", "/"],
  ["갤러리", "/galleries"],
  ["유저거래", "/market"],
  ["굿즈검색", "/goods"]
];

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const nav = isAdminEmail(email) ? [...defaultNav, ["관리자", "/admin"]] : defaultNav;

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/86 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-black text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-white">
            <Sparkles size={18} />
          </span>
          세모덕
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm font-bold text-slate-600">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="order-last flex w-full items-center gap-2 rounded-lg bg-cloud px-3 py-2 text-sm text-slate-500 md:order-none md:w-64">
          <Search size={16} />
          <span>굿즈, 갤러리, 게시글 검색</span>
        </div>
        <AuthButton />
      </div>
    </header>
  );
}
