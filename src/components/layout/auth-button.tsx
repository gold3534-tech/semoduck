"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SessionResponse = {
  user: {
    id: string;
    email: string | null;
    nickname: string | null;
  } | null;
};

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  async function loadProfile() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await response.json()) as SessionResponse;
      const user = data.user;

      setEmail(user?.email ?? null);
      setNickname(user?.nickname ?? user?.email?.split("@")[0] ?? null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    loadProfile();
    const refreshTimer = window.setTimeout(loadProfile, 500);
    window.addEventListener("focus", loadProfile);
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", loadProfile);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setEmail(null);
    setNickname(null);
  }

  if (!ready) {
    return <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />;
  }

  if (email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-32 truncate text-xs font-black text-slate-600 sm:inline" title={email}>
          {nickname ?? email}
        </span>
        <Link href="/mypage" className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-ink px-3 text-xs font-black text-white">
          <UserRound size={14} />
          마이
        </Link>
        <button onClick={signOut} title={email} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-white px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
          <LogOut size={14} />
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-ink px-3 text-xs font-black text-white">
      <LogIn size={14} />
      로그인
    </Link>
  );
}
