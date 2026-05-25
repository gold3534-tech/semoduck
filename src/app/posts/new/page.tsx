import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { WriteForm } from "@/app/posts/new/write-form";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getGalleries() {
  const supabase = createDataSupabaseClient();
  const { data } = await supabase.from("galleries").select("id,name,slug").order("name");
  return data ?? [];
}

export default async function NewPostPage() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    redirect("/login?next=/posts/new");
  }

  const galleries = await getGalleries();
  return (
    <div className="space-y-6">
      <section className="relative min-h-[7.5rem] overflow-hidden rounded-[2rem] border-2 border-[#ead0f4] bg-white/80 p-8 shadow-[0_18px_60px_rgba(126,80,178,0.08)] md:p-10">
        <Image src="/semoduck-write-hero.png" alt="" width={230} height={135} priority className="pointer-events-none absolute bottom-0 right-12 hidden md:block" />
        <p className="text-sm font-black text-[#ff6f9b]">글쓰기 ✨</p>
        <h1 className="mt-3 text-5xl font-black leading-tight text-[#6f4ab4]">글쓰기</h1>
        <p className="mt-3 max-w-xl text-base font-bold leading-7 text-[#5b506b]">갤러리에 덕질 이야기를 남겨보세요.</p>
      </section>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white" />}>
        <WriteForm galleries={galleries} />
      </Suspense>
    </div>
  );
}
