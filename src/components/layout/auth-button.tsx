"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  async function loadProfile() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    setEmail(user?.email ?? null);
    if (!user) {
      setNickname(null);
      setReady(true);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
    setNickname(profile?.nickname ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? null);
    setReady(true);
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    loadProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });
    return () => listener.subscription.unsubscribe();
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
