import Image from "next/image";
import { SuggestionForm } from "@/app/suggestions/suggestion-form";

export default function SuggestionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="relative min-h-[10rem] overflow-hidden rounded-[1.5rem] border border-[#dfc5ee] bg-[#fff8fb] p-5 shadow-soft md:min-h-[12rem] md:p-6">
        <Image src="/semoduck-suggestions-hero.png" alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="pointer-events-none object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/86 via-white/58 to-white/12" />
        <div className="relative max-w-xl">
          <p className="text-sm font-black text-[#ff6f9b]">건의함</p>
          <h1 className="banner-title mt-1 max-w-2xl text-2xl font-black leading-tight text-[#6f4ab4] md:text-3xl">세모덕에 필요한 갤러리나 기능을 알려주세요</h1>
          <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-slate-500">갤러리 추가 요청, 기능 제안, 오류 제보를 관리자에게 보낼 수 있습니다.</p>
        </div>
      </section>
      <SuggestionForm />
    </div>
  );
}
