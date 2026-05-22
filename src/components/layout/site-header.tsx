"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <header className="sticky top-0 z-30 border-b border-violet/10 bg-white/88 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-black text-ink" aria-label="세모덕 홈">
          <img src="/semoduck-icon.svg" alt="" className="h-11 w-11" />
          <img src="/semoduck-logo.svg" alt="세모덕" className="h-10 w-auto max-w-[8.5rem]" />
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm font-bold text-slate-600">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <form onSubmit={submitSearch} className="order-last flex w-full items-center gap-2 rounded-lg bg-cloud px-3 py-2 text-sm text-slate-500 ring-1 ring-violet/10 focus-within:ring-2 focus-within:ring-violet/35 md:order-none md:w-72">
          <Search size={16} className="shrink-0 text-violet" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="갤러리, 유저거래, 굿즈 검색" />
        </form>
        <AuthButton />
      </div>
    </header>
  );
}
