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
    <div className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#fff9ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_24%,rgba(194,156,255,0.22),transparent_16rem),radial-gradient(circle_at_84%_20%,rgba(255,152,194,0.18),transparent_18rem),radial-gradient(circle_at_50%_100%,rgba(255,236,178,0.24),transparent_26rem)]" />
      <Decorations />
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 py-4">
        <div className="mb-3 text-center">
          <Image src="/semoduck-logo.png" alt="세모덕" width={260} height={100} priority className="mx-auto h-auto w-48 object-contain md:w-60" />
          <p className="mt-1 text-xs font-black text-[#8b61c8] md:text-sm">덕질도, 소통도, 거래도! 세상의 모든 덕질이 모이는 곳</p>
        </div>
        <Suspense fallback={<div className="h-[30rem] w-full max-w-xl animate-pulse rounded-[2rem] bg-white/80" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}

function Decorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 text-4xl">
      <span className="absolute left-[7%] top-[25%] rotate-12 text-[#c6a4ff]/55">☆</span>
      <span className="absolute right-[10%] top-[19%] -rotate-12 text-[#ff93bd]/55">☆</span>
      <span className="absolute bottom-[22%] left-[16%] text-[#ff7fad]/55">♡</span>
      <span className="absolute bottom-[34%] right-[18%] text-[#b58cff]/55">♥</span>
      <span className="absolute bottom-[48%] left-[9%] text-xl text-[#b58cff]/45">✦</span>
      <span className="absolute bottom-[18%] right-[12%] text-2xl text-[#ffb2d0]/45">✦</span>
    </div>
  );
}
