"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Loader2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

type Mode = "signin" | "signup";

function safeNext(value: string | null) {
  return value?.startsWith("/") ? value : "/";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState(callbackError ?? "");
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectUrl = new URL("/auth/callback", getSiteUrl());
      redirectUrl.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl.toString() }
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google 로그인 요청에 실패했습니다.");
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace(next);
        router.refresh();
        return;
      }

      const redirectUrl = new URL("/auth/callback", getSiteUrl());
      redirectUrl.searchParams.set("next", next);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: nickname || email.split("@")[0] },
          emailRedirectTo: redirectUrl.toString()
        }
      });
      setLoading(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }

      setMessage("회원가입 메일을 확인해 주세요. 인증 후 보던 화면으로 돌아옵니다.");
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "Supabase 인증 요청에 실패했습니다.");
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-sm font-black text-berry">계정</p>
        <h1 className="mt-2 text-3xl font-black">{mode === "signin" ? "로그인" : "회원가입"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Google 또는 이메일 계정으로 세모덕에 접속할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-cloud p-1">
        <button type="button" className={`min-h-10 rounded-md text-sm font-black ${mode === "signin" ? "bg-white shadow-sm" : "text-slate-500"}`} onClick={() => setMode("signin")}>
          로그인
        </button>
        <button type="button" className={`min-h-10 rounded-md text-sm font-black ${mode === "signup" ? "bg-white shadow-sm" : "text-slate-500"}`} onClick={() => setMode("signup")}>
          회원가입
        </button>
      </div>

      <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Chrome size={16} />}
        Google로 계속하기
      </button>

      <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        또는
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <label className="grid gap-2 text-sm font-black">
            닉네임
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="세모덕러" />
          </label>
        )}
        <label className="grid gap-2 text-sm font-black">
          이메일
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="you@example.com" />
        </label>
        <label className="grid gap-2 text-sm font-black">
          비밀번호
          <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="6자 이상" />
        </label>
        <Button className="w-full" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "signin" ? <Mail size={16} /> : <UserPlus size={16} />}
          {mode === "signin" ? "이메일로 로그인" : "이메일로 가입"}
        </Button>
      </form>

      {message && <p className="mt-4 rounded-lg bg-pink-50 p-3 text-sm font-bold leading-6 text-pink-700">{message}</p>}
    </Card>
  );
}
