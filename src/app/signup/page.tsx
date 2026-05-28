import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SignupForm } from "@/app/signup/signup-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (data.user) {
    redirect("/");
  }

  return (
    <div className="relative left-1/2 min-h-[100dvh] w-screen -translate-x-1/2 overflow-hidden bg-[#fff9ff]">
      <Image src="/semoduck-auth-bg.png" alt="" fill priority sizes="100vw" className="pointer-events-none object-cover object-center" />
      <div className="absolute inset-0 bg-white/30" />
      <Link href="/" className="absolute left-5 top-5 z-20 inline-flex h-10 items-center gap-1 rounded-full bg-white/85 px-4 text-sm font-black text-[#6f4ab4] shadow-sm ring-1 ring-[#ead8f4] backdrop-blur transition hover:bg-white">
        <ChevronLeft size={18} />
        홈으로
      </Link>
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[54rem] flex-col items-center justify-center gap-3 px-6 py-5 sm:px-10">
        <div className="text-center">
          <Image src="/semoduck-logo.png" alt="세모덕" width={260} height={100} priority className="mx-auto h-auto w-44 object-contain md:w-56" />
          <p className="banner-copy mt-1 text-xs font-black text-[#8b61c8] md:text-sm">좋아하는 것들을 모으고 이야기할 내 덕질 공간을 만들어보세요</p>
        </div>
        <Suspense fallback={<div className="h-[30rem] w-full max-w-md animate-pulse rounded-[1.75rem] bg-white/80" />}>
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}
