import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (data.user) {
    redirect("/");
  }

  return (
    <div className="grid gap-5 py-4 lg:grid-cols-[1fr_24rem] lg:items-center">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[#efd7e7] bg-gradient-to-br from-[#fff8fb] via-[#fbf1ff] to-[#fffaf0] p-5 shadow-soft md:p-6">
        <Image src="/semoduck-logo.png" alt="세모덕" width={168} height={66} className="h-auto w-36" priority />
        <h1 className="mt-5 max-w-xl text-2xl font-black leading-tight text-[#3a285f] md:text-3xl">내 덕질 공간으로 들어가기</h1>
        <p className="mt-3 max-w-lg text-sm font-bold leading-6 text-[#70657f]">관심 갤러리, 찜한 굿즈, 유저거래를 한 곳에서 이어볼 수 있어요.</p>
      </section>
      <div>
        <Suspense fallback={<div className="mx-auto h-96 max-w-md animate-pulse rounded-[2rem] bg-white" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
