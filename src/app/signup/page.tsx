import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignupForm } from "@/app/signup/signup-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (data.user) {
    redirect("/");
  }

  return (
    <div className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#fff9ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_22%,rgba(194,156,255,0.22),transparent_16rem),radial-gradient(circle_at_84%_24%,rgba(255,152,194,0.18),transparent_18rem),radial-gradient(circle_at_50%_100%,rgba(255,236,178,0.24),transparent_26rem)]" />
      <Decorations />
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 py-10">
        <div className="mb-5 text-center">
          <Image src="/semoduck-logo.png" alt="세모덕" width={360} height={140} priority className="mx-auto h-auto w-72 md:w-96" />
          <p className="mt-2 text-sm font-black text-[#8b61c8] md:text-base">좋아하는 것들을 모으고 이야기할 내 덕질 공간을 만들어보세요</p>
        </div>
        <Suspense fallback={<div className="h-[32rem] w-full max-w-xl animate-pulse rounded-[2rem] bg-white/80" />}>
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}

function Decorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 text-4xl">
      <span className="absolute left-[8%] top-[26%] rotate-12 text-[#c6a4ff]/55">☆</span>
      <span className="absolute right-[11%] top-[20%] -rotate-12 text-[#ff93bd]/55">☆</span>
      <span className="absolute bottom-[23%] left-[17%] text-[#ff7fad]/55">♡</span>
      <span className="absolute bottom-[35%] right-[18%] text-[#b58cff]/55">♥</span>
      <span className="absolute bottom-[48%] left-[10%] text-xl text-[#b58cff]/45">✦</span>
      <span className="absolute bottom-[18%] right-[13%] text-2xl text-[#ffb2d0]/45">✦</span>
    </div>
  );
}
