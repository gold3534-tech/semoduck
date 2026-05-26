import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { MarketWriteForm } from "@/app/market/new/market-write-form";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getGalleries() {
  const supabase = createDataSupabaseClient();
  const { data } = await supabase.from("galleries").select("id,name,slug").order("name");
  return data ?? [];
}

export default async function NewMarketPage() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    redirect("/login");
  }

  const galleries = await getGalleries();

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[#ead0f4] bg-white/82 p-4 shadow-[0_12px_34px_rgba(126,80,178,0.06)] md:p-5">
        <Image src="/semoduck-market-hero.png" alt="" width={88} height={88} priority className="pointer-events-none absolute bottom-3 right-6 hidden rounded-2xl md:block" />
        <p className="text-sm font-black text-[#ff6f9b]">유저거래</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-[#6f4ab4] md:text-3xl">거래 글쓰기</h1>
        <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-[#5b506b]">판매, 교환, 나눔 글을 갤러리에 맞춰 등록해보세요.</p>
      </section>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white" />}>
        <MarketWriteForm galleries={galleries} />
      </Suspense>
    </div>
  );
}
