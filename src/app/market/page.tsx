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
    <div className="space-y-4">
      <section className="relative min-h-[10rem] overflow-hidden rounded-2xl border border-[#ead0f4] bg-white/82 p-5 shadow-[0_10px_26px_rgba(126,80,178,0.05)] md:min-h-[11.5rem] md:p-6">
        <Image src="/semoduck-market-hero.png" alt="" fill priority sizes="(max-width: 768px) 100vw, 86rem" className="pointer-events-none object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/62 to-white/18" />
        <div className="relative max-w-xl">
          <p className="text-sm font-black text-[#ff6f9b]">유저거래</p>
          <h1 className="banner-title mt-1 text-2xl font-black leading-tight text-[#6f4ab4] md:text-3xl">유저거래</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#44385a]">판매, 교환, 나눔으로 덕질템을 나누는 내부 게시판입니다.</p>
        </div>
      </section>
      <MarketBoard initialItems={items as any} galleries={galleries} currentUserId={currentUserId} isAdmin={isAdmin} />
    </div>
  );
}
