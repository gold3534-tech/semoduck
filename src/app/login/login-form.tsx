"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(callbackError ?? "");
  const [loading, setLoading] = useState<"login" | "google" | null>(null);

  async function signInWithGoogle() {
    setLoading("google");
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
        setLoading(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google 로그인 요청에 실패했습니다.");
      setLoading(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("login");
    setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(null);
      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace(next === "/login" || next === "/signup" ? "/" : next);
      router.refresh();
    } catch (error) {
      setLoading(null);
      setMessage(error instanceof Error ? error.message : "로그인 요청에 실패했습니다.");
    }
  }

  return (
    <section className="w-full max-w-lg rounded-[1.75rem] border border-[#ead8f4] bg-white/86 px-7 py-6 shadow-[0_22px_70px_rgba(126,80,178,0.13)] backdrop-blur md:px-10">
      <div className="text-center">
        <Image src="/semoduck-logo.png" alt="세모덕" width={210} height={82} className="mx-auto h-auto w-40" />
        <p className="mt-1 text-sm font-bold text-[#70657f]">세모덕에서 덕질을 더 즐겁게 시작해보세요!</p>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#e5ddee] bg-white px-4 text-[#9b63d6] shadow-sm focus-within:border-[#b984e7]">
          <UserRound size={21} />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#2f2352] outline-none placeholder:text-[#a9a0b8] md:text-base"
            placeholder="아이디 또는 이메일을 입력하세요"
          />
        </label>

        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#e5ddee] bg-white px-4 text-[#9b63d6] shadow-sm focus-within:border-[#b984e7]">
          <LockKeyhole size={21} />
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#2f2352] outline-none placeholder:text-[#a9a0b8] md:text-base"
            placeholder="비밀번호를 입력하세요"
          />
          <button type="button" onClick={() => setShowPassword((current) => !current)} className="grid h-9 w-9 place-items-center rounded-full text-[#8b61c8]" aria-label="비밀번호 보기 전환">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </label>

        <label className="inline-flex items-center gap-2 text-sm font-bold text-[#6f5d86]">
          <input type="checkbox" checked={keepSignedIn} onChange={(event) => setKeepSignedIn(event.target.checked)} className="h-4 w-4 accent-[#9b63d6]" />
          로그인 상태 유지
        </label>

        <button disabled={loading !== null} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#9b7cf3] via-[#d986db] to-[#ff8cb1] text-base font-black text-white shadow-[0_12px_30px_rgba(255,111,155,0.23)] transition hover:brightness-105 disabled:opacity-70">
          {loading === "login" ? <Loader2 size={20} className="animate-spin" /> : "로그인"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-4 text-sm font-black text-[#8a7b9e]">
        <span className="h-px flex-1 bg-[#ead8f4]" />
        또는
        <span className="h-px flex-1 bg-[#ead8f4]" />
      </div>

      <button type="button" onClick={signInWithGoogle} disabled={loading !== null} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-[#4f4564] ring-1 ring-[#e5ddee] shadow-sm transition hover:bg-[#fff7fb] disabled:opacity-70">
        {loading === "google" ? <Loader2 size={18} className="animate-spin" /> : <Chrome size={18} />}
        구글로 시작하기
      </button>

      <div className="mt-5 text-center">
        <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-sm font-black text-[#6f4ab4] hover:text-[#ff6f9b]">
          회원가입
        </Link>
      </div>

      {message && <p className="mt-5 rounded-2xl bg-pink-50 p-3 text-sm font-bold leading-6 text-pink-700">{message}</p>}
      <p className="sr-only">{keepSignedIn ? "로그인 상태 유지 선택됨" : "로그인 상태 유지 해제됨"}</p>
    </section>
  );
}
