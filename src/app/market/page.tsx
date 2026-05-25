import Image from "next/image";
import { MarketBoard } from "@/app/market/market-board";
import { isAdminEmail } from "@/lib/auth";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Gallery } from "@/types/domain";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = auth.user?.id ?? null;
  const isAdmin = isAdminEmail(auth.user?.email);

  const [itemsResult, galleriesResult] = await Promise.all([
    supabase
      .from("market_items")
      .select("id,seller_id,title,description,trade_type,status,price,region,image_url,created_at,profiles(nickname,email),galleries(name,slug)")
      .in("status", ["active", "reserved", "completed"])
      .neq("trade_type", "transfer")
      .order("created_at", { ascending: false }),
    supabase.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").order("name")
  ]);

  const items = (itemsResult.data ?? []).map((item) => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles,
    galleries: Array.isArray(item.galleries) ? item.galleries[0] ?? null : item.galleries
  }));
  const galleries: Gallery[] = (galleriesResult.data ?? []).map((gallery) => ({
    id: gallery.id,
    name: gallery.name,
    slug: gallery.slug,
    description: gallery.description,
    category: gallery.category,
    thumbnail: gallery.thumbnail_url ?? "/placeholder-goods.svg",
    followerCount: gallery.follower_count ?? 0,
    postCount: gallery.post_count ?? 0,
    tags: [gallery.category].filter(Boolean)
  }));

  return { items, galleries, currentUserId, isAdmin };
}

export default async function MarketPage() {
  const { items, galleries, currentUserId, isAdmin } = await getData();
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[#ead0f4] bg-white/82 p-4 shadow-[0_12px_34px_rgba(126,80,178,0.06)] md:p-5">
        <Image src="/semoduck-market-hero.png" alt="" width={96} height={96} priority className="pointer-events-none absolute right-5 top-1/2 hidden h-20 w-20 -translate-y-1/2 rounded-2xl object-cover md:block" />
        <div className="relative max-w-xl pr-0 md:pr-28">
          <p className="text-sm font-black text-[#ff6f9b]">유저거래</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-[#6f4ab4] md:text-3xl">유저거래</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#44385a]">판매, 교환, 나눔으로 덕질템을 나누는 내부 게시판입니다.</p>
        </div>
      </section>
      <MarketBoard initialItems={items as any} galleries={galleries} currentUserId={currentUserId} isAdmin={isAdmin} />
    </div>
  );
}
