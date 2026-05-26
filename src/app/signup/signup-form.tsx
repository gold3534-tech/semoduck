"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password !== passwordConfirm) {
      setMessage("비밀번호가 서로 다릅니다.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectUrl = new URL("/auth/callback", getSiteUrl());
      redirectUrl.searchParams.set("next", next === "/login" || next === "/signup" ? "/" : next);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: email.trim().split("@")[0] },
          emailRedirectTo: redirectUrl.toString()
        }
      });

      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace(next === "/login" || next === "/signup" ? "/" : next);
        router.refresh();
        return;
      }

      setMessage("회원가입 확인 메일을 보냈습니다. 메일 인증 후 로그인해주세요.");
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "회원가입 요청에 실패했습니다.");
    }
  }

  return (
    <section className="w-full max-w-xl rounded-[2rem] border border-[#ead8f4] bg-white/86 px-8 py-9 shadow-[0_22px_70px_rgba(126,80,178,0.13)] backdrop-blur md:px-12">
      <div className="text-center">
        <h1 className="text-4xl font-black text-[#6f4ab4] md:text-5xl">회원가입 <span className="text-[#ff6f9b]">♥</span></h1>
        <p className="mt-3 text-sm font-bold text-[#70657f] md:text-base">아이디와 비밀번호로 세모덕 계정을 만들어보세요.</p>
      </div>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#e5ddee] bg-white px-4 text-[#9b63d6] shadow-sm focus-within:border-[#b984e7]">
          <UserRound size={23} />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#2f2352] outline-none placeholder:text-[#a9a0b8] md:text-base"
            placeholder="아이디로 사용할 이메일을 입력하세요"
          />
        </label>

        <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#e5ddee] bg-white px-4 text-[#9b63d6] shadow-sm focus-within:border-[#b984e7]">
          <LockKeyhole size={23} />
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

        <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#e5ddee] bg-white px-4 text-[#9b63d6] shadow-sm focus-within:border-[#b984e7]">
          <LockKeyhole size={23} />
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#2f2352] outline-none placeholder:text-[#a9a0b8] md:text-base"
            placeholder="비밀번호를 한 번 더 입력하세요"
          />
        </label>

        <button disabled={loading} className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#9b7cf3] via-[#d986db] to-[#ff8cb1] text-lg font-black text-white shadow-[0_12px_30px_rgba(255,111,155,0.23)] transition hover:brightness-105 disabled:opacity-70">
          {loading ? <Loader2 size={20} className="animate-spin" /> : "회원가입"}
        </button>
      </form>

      <div className="mt-7 text-center">
        <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-sm font-black text-[#6f4ab4] hover:text-[#ff6f9b]">
          이미 계정이 있어요
        </Link>
      </div>

      {message && <p className="mt-5 rounded-2xl bg-pink-50 p-3 text-sm font-bold leading-6 text-pink-700">{message}</p>}
    </section>
  );
}
