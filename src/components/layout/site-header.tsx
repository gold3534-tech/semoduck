"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Bell, MessageSquare, Search } from "lucide-react";
import { AuthButton } from "@/components/layout/auth-button";
import { isAdminEmail } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const defaultNav = [
  ["홈", "/"],
  ["갤러리", "/galleries"],
  ["유저거래", "/market"],
  ["굿즈검색", "/goods"],
  ["건의함", "/suggestions"]
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function loadSession() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await response.json()) as { user: { email: string | null } | null };
      setEmail(data.user?.email ?? null);
    } catch {
      setEmail(null);
    }
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    loadSession();
    const refreshTimer = window.setTimeout(loadSession, 500);
    window.addEventListener("focus", loadSession);
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", loadSession);
      listener.subscription.unsubscribe();
    };
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = query.trim();
    router.push(keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search");
  }

  const nav = isAdminEmail(email) ? [...defaultNav, ["관리자", "/admin"]] : defaultNav;

  return (
    <header className="sticky top-0 z-30 border-b border-[#f1d6e5] bg-[#fffaf6]/92 backdrop-blur-xl">
      <div className="mx-auto grid min-h-16 w-full max-w-6xl grid-cols-[7.5rem_minmax(27rem,1fr)_minmax(14rem,20rem)_auto] items-center gap-3 px-5 py-2">
        <Link href="/" className="flex items-center" aria-label="세모덕 홈">
          <Image src="/semoduck-logo.png" alt="세모덕" width={128} height={48} priority className="h-auto w-28 object-contain" />
        </Link>
        <nav className="flex min-w-0 flex-nowrap items-center justify-center gap-1.5 text-xs font-black text-[#281a47]">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-2xl px-3 py-2.5 transition hover:bg-[#ffeaf1] hover:text-[#f15f91] ${pathname === href ? "bg-[#ffeaf1] text-[#f15f91]" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <form onSubmit={submitSearch} className="flex min-w-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-[#efd7e7] focus-within:ring-2 focus-within:ring-[#b984e7]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="굿즈, 캐릭터, 작품명을 검색해 보세요!" />
          <Search size={18} className="shrink-0 text-[#5c2f8f]" />
        </form>
        <div className="flex items-center justify-end gap-2">
          <Link href="/mypage/likes" className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[#2f2352] ring-1 ring-[#ead8f4]">
            <Bell size={17} />
          </Link>
          <Link href="/posts/new" className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[#2f2352] ring-1 ring-[#ead8f4]">
            <MessageSquare size={17} />
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
