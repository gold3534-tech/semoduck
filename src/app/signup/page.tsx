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
    <div className="fixed inset-0 z-40 h-dvh w-screen overflow-y-auto overflow-x-hidden bg-[#fff9ff]">
      <Image src="/semoduck-auth-bg.png" alt="" fill priority sizes="100vw" className="pointer-events-none scale-[1.02] object-cover object-center" />
      <div className="absolute inset-0 bg-white/18" />
      <Link href="/" className="absolute left-5 top-5 z-20 inline-flex h-10 items-center gap-1 rounded-full bg-white/85 px-4 text-sm font-black text-[#6f4ab4] shadow-sm ring-1 ring-[#ead8f4] backdrop-blur transition hover:bg-white">
        <ChevronLeft size={18} />
        홈으로
      </Link>
      <main className="relative z-10 flex min-h-full w-full items-center justify-center px-6 py-5 sm:px-10">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Image src="/semoduck-logo.png" alt="세모덕" width={260} height={100} priority className="mx-auto h-auto w-44 object-contain md:w-56" />
            <p className="banner-copy mt-1 text-xs font-black text-[#8b61c8] md:text-sm">좋아하는 것들을 모으고 이야기할 내 덕질 공간을 만들어보세요</p>
          </div>
          <div className="mt-3">
            <Suspense fallback={<div className="h-[30rem] w-full animate-pulse rounded-[1.75rem] bg-white/80" />}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
