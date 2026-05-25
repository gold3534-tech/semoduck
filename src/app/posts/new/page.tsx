import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { WriteForm } from "@/app/posts/new/write-form";
import { productFromDbRow, productSelect } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getGalleries() {
  const supabase = createDataSupabaseClient();
  const { data } = await supabase.from("galleries").select("id,name,slug").order("name");
  return data ?? [];
}

async function getRecommendations(galleries: Awaited<ReturnType<typeof getGalleries>>) {
  const supabase = createDataSupabaseClient();
  const entries = await Promise.all(
    galleries.map(async (gallery) => {
      const terms = [gallery.name, gallery.slug].filter(Boolean);
      const filters = terms.flatMap((term) => [`title.ilike.%${term}%`, `brand.ilike.%${term}%`, `category.ilike.%${term}%`, `description.ilike.%${term}%`]);
      const { data } = filters.length
        ? await supabase.from("products").select(productSelect).or(filters.join(",")).order("is_official_product", { ascending: false }).limit(4)
        : { data: [] };
      return [gallery.slug, (data ?? []).map(productFromDbRow).filter((product) => product.offers.length).slice(0, 4)] as const;
    })
  );
  return Object.fromEntries(entries);
}

export default async function NewPostPage() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    redirect("/login?next=/posts/new");
  }

  const galleries = await getGalleries();
  const recommendations = await getRecommendations(galleries);
  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[#ead0f4] bg-white/82 p-4 shadow-[0_12px_34px_rgba(126,80,178,0.06)] md:p-5">
        <Image src="/semoduck-write-hero.png" alt="" width={88} height={58} priority className="pointer-events-none absolute bottom-0 right-6 hidden md:block" />
        <p className="text-sm font-black text-[#ff6f9b]">글쓰기 ✨</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-[#6f4ab4] md:text-3xl">글쓰기</h1>
        <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-[#5b506b]">갤러리에 덕질 이야기를 남겨보세요.</p>
      </section>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white" />}>
        <WriteForm galleries={galleries} recommendations={recommendations} />
      </Suspense>
    </div>
  );
}
