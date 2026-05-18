"use client";

import { LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setEmail(null);
  }

  if (!ready) {
    return <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />;
  }

  if (email) {
    return (
      <div className="flex items-center gap-2">
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
