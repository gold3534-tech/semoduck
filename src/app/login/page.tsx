import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (data.user) {
    redirect("/");
  }

  return (
    <div className="fixed inset-0 z-40 h-dvh w-screen overflow-y-auto overflow-x-hidden bg-[#fff9ff]">
      <Image
        src="/semoduck-auth-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center scale-[1.02]"
      />

      <div className="absolute inset-0 bg-white/18" />

      <Link
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex h-10 items-center gap-1 rounded-full bg-white/85 px-4 text-sm font-black text-[#6f4ab4] shadow-sm ring-1 ring-[#ead8f4] backdrop-blur transition hover:bg-white"
      >
        <ChevronLeft size={18} />
        홈으로
      </Link>

      <main className="relative z-10 flex h-full w-full items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md -translate-y-4">
          <div className="text-center">
            <Image
              src="/semoduck-logo.png"
              alt="세모덕"
              width={260}
              height={100}
              priority
              className="mx-auto h-auto w-44 object-contain md:w-56"
            />
            <p className="banner-copy mt-1 text-xs font-black text-[#8b61c8] md:text-sm">
              덕질도, 소통도, 거래도 세모덕에서 시작해요
            </p>
          </div>

          <div className="mt-3">
            <Suspense
              fallback={
                <div className="h-[26rem] w-full animate-pulse rounded-[1.75rem] bg-white/80" />
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
