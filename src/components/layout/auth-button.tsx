"use client";

import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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

  async function signInWithGoogle() {
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` }
    });
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setEmail(null);
  }

  if (!ready) {
    return <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />;
  }

  if (email) {
    return (
      <Button variant="secondary" onClick={signOut} title={email}>
        <LogOut size={16} />
        로그아웃
      </Button>
    );
  }

  return (
    <Button onClick={signInWithGoogle}>
      <LogIn size={16} />
      Google 로그인
    </Button>
  );
}
