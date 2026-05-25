"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />;
  }

  if (email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-24 truncate text-xs font-black text-slate-600 xl:inline" title={email}>
          {nickname ?? email}
        </span>
        <Link href="/mypage" className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-ink px-3 text-xs font-black text-white">
          <UserRound size={13} />
          마이
        </Link>
        <button onClick={signOut} title={email} className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-white px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
          <LogOut size={13} />
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-ink px-3 text-xs font-black text-white">
      <LogIn size={13} />
      로그인
    </Link>
  );
}
