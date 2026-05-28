"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
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
  const [sessionUser, setSessionUser] = useState<{ email: string | null; role?: string | null } | null>(null);
  const [query, setQuery] = useState("");
  const hideHeader = pathname === "/login" || pathname === "/signup";

  async function loadSession() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const text = await response.text();
      const data = (text ? JSON.parse(text) : { user: null }) as { user: { email: string | null; role?: string | null } | null };
      setSessionUser(data.user ?? null);
    } catch {
      setSessionUser(null);
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

  const showAdmin = sessionUser?.role === "admin" && isAdminEmail(sessionUser.email);
  const nav = showAdmin ? [...defaultNav, ["관리자", "/admin"]] : defaultNav;

  if (hideHeader) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-[#f1d6e5] bg-[#fffaf6]/92 backdrop-blur-xl">
      <div className="mx-auto grid min-h-16 w-full max-w-5xl grid-cols-[7.25rem_minmax(20rem,1fr)_minmax(13rem,18rem)_auto] items-center gap-3 px-6 py-2 sm:px-8 xl:max-w-[68rem] xl:grid-cols-[7.25rem_minmax(23rem,1fr)_minmax(14rem,20rem)_auto] 2xl:max-w-[74rem] 2xl:grid-cols-[7.5rem_minmax(25rem,1fr)_minmax(15rem,22rem)_auto] 2xl:px-10 min-[1800px]:max-w-[86rem] min-[1800px]:grid-cols-[8rem_minmax(31rem,1fr)_minmax(18rem,27rem)_auto] min-[2200px]:max-w-[96rem]">
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
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
