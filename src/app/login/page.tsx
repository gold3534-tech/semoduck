import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[1fr_28rem] lg:items-center">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#efd7e7] bg-gradient-to-br from-[#fff8fb] via-[#fbf1ff] to-[#fffaf0] p-8 shadow-soft md:p-12">
        <Image src="/semoduck-logo.png" alt="세모덕" width={260} height={102} className="h-auto w-56" priority />
        <h1 className="mt-8 max-w-xl text-4xl font-black leading-tight text-[#3a285f] md:text-5xl">내 덕질 공간으로 들어가기</h1>
        <p className="mt-4 max-w-lg text-base font-bold leading-7 text-[#70657f]">관심 갤러리, 찜한 굿즈, 유저거래를 한 곳에서 이어볼 수 있어요.</p>
        <div className="pointer-events-none absolute bottom-8 right-10 hidden text-7xl md:block">✨</div>
      </section>
      <div>
        <Suspense fallback={<div className="mx-auto h-96 max-w-md animate-pulse rounded-[2rem] bg-white" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
