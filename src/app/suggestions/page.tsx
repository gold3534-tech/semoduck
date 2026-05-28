import Image from "next/image";
import { redirect } from "next/navigation";
import { SuggestionForm } from "@/app/suggestions/suggestion-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RelatedSideCard } from "@/components/related-side-card";
import { getRelatedSideItems } from "@/lib/related-side-items";

export default async function SuggestionsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    redirect("/login?next=/suggestions");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="relative h-[155px] overflow-hidden rounded-[1.5rem] border border-[#dfc5ee] bg-[#fff8fb] p-5 shadow-soft md:h-[175px] md:p-6">
        <Image
          src="/semoduck-suggestions-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="pointer-events-none scale-[0.92] object-contain object-right"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/88 via-white/60 to-white/8" />

        <div className="relative max-w-xl">
          <p className="text-xs font-black text-[#ff6f9b] md:text-sm">
            건의함
          </p>
          <h1 className="banner-title mt-1 max-w-2xl text-xl font-black leading-tight text-[#6f4ab4] md:text-2xl">
            세모덕에 필요한 갤러리나 기능을 알려주세요
          </h1>
          <p className="mt-2 max-w-xl text-xs font-bold leading-5 text-slate-500 md:text-sm md:leading-6">
            갤러리 추가 요청, 기능 제안, 오류 제보를 관리자에게 보낼 수 있습니다.
          </p>
        </div>
      </section>

      <SuggestionForm />
    </div>
  );
}