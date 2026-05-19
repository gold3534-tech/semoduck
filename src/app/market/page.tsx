import { MarketBoard } from "@/app/market/market-board";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import type { Gallery } from "@/types/domain";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createDataSupabaseClient();
  const [itemsResult, galleriesResult] = await Promise.all([
    supabase.from("market_items").select("id,title,description,trade_type,status,price,region,image_url,created_at,profiles(nickname),galleries(name,slug)").in("status", ["active", "reserved", "completed"]).neq("trade_type", "transfer").order("created_at", { ascending: false }),
    supabase.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").order("name")
  ]);
  const items = (itemsResult.data ?? []).map((item) => ({ ...item, profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles, galleries: Array.isArray(item.galleries) ? item.galleries[0] ?? null : item.galleries }));
  const galleries: Gallery[] = (galleriesResult.data ?? []).map((gallery) => ({ id: gallery.id, name: gallery.name, slug: gallery.slug, description: gallery.description, category: gallery.category, thumbnail: gallery.thumbnail_url ?? "/placeholder-goods.svg", followerCount: gallery.follower_count ?? 0, postCount: gallery.post_count ?? 0, tags: [gallery.category].filter(Boolean) }));
  return { items, galleries };
}

export default async function MarketPage() {
  const { items, galleries } = await getData();
  return <div className="space-y-6"><div><p className="text-sm font-black text-berry">유저거래</p><h1 className="mt-2 text-3xl font-black">판매, 교환, 나눔을 올리는 거래 게시판</h1><p className="mt-3 text-slate-600">세모덕은 결제나 배송을 대행하지 않고, 유저가 직접 거래 글을 관리합니다.</p></div><MarketBoard initialItems={items as any} galleries={galleries} /></div>;
}
