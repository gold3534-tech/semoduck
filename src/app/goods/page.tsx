import { GoodsSearch, type RecommendedGoodsGroup } from "@/app/goods/search";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

export const dynamic = "force-dynamic";

function productFrom(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    normalizedTitle: row.normalized_title,
    brand: row.brand ?? "",
    category: row.category,
    description: row.description ?? "",
    image: row.image_url ?? "/placeholder-goods.svg",
    isOfficialProduct: row.is_official_product ?? false,
    tags: [row.category, row.brand].filter(Boolean) as string[],
    gallerySlugs: [],
    bookmarkCount: row.bookmark_count ?? 0,
    offers: ((row.product_offers ?? []) as Array<{
      id: string;
      source: Product["offers"][number]["source"];
      mall_name: string;
      price: number;
      shipping_fee: number;
      condition: Product["offers"][number]["condition"];
      is_official: boolean;
      is_used: boolean;
      special_benefit?: string | null;
      url: string;
    }>).map((offer) => ({
      id: offer.id,
      source: offer.source,
      mallName: offer.mall_name,
      price: offer.price,
      shippingFee: offer.shipping_fee,
      condition: offer.condition,
      isOfficial: offer.is_official,
      isUsed: offer.is_used,
      specialBenefit: offer.special_benefit ?? undefined,
      url: offer.url
    }))
  };
}

async function getUserInterests() {
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!auth.user) return [];

  const supabase = createDataSupabaseClient();
  const { data } = await supabase.from("user_interests").select("interests(name)").eq("user_id", auth.user.id);
  return (data ?? [])
    .map((row: any) => {
      const interest = Array.isArray(row.interests) ? row.interests[0] : row.interests;
      return interest?.name as string | undefined;
    })
    .filter(Boolean) as string[];
}

async function getRecommendedGroups(): Promise<RecommendedGoodsGroup[]> {
  const supabase = createDataSupabaseClient();
  const interests = await getUserInterests();
  const productSelect = "id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)";

  if (!interests.length) {
    const { data } = await supabase.from("products").select(productSelect).eq("is_deleted", false).order("created_at", { ascending: false }).limit(6);
    return [{ title: "최근 등록된 굿즈", products: (data ?? []).map(productFrom) }];
  }

  const groups = await Promise.all(
    interests.slice(0, 5).map(async (interest) => {
      const { data } = await supabase
        .from("products")
        .select(productSelect)
        .eq("is_deleted", false)
        .or(`title.ilike.%${interest}%,brand.ilike.%${interest}%,category.ilike.%${interest}%,description.ilike.%${interest}%`)
        .order("created_at", { ascending: false })
        .limit(4);
      return { title: `${interest} 추천 굿즈`, products: (data ?? []).map(productFrom) };
    })
  );

  const nonEmpty = groups.filter((group) => group.products.length);
  if (nonEmpty.length) return nonEmpty;

  const { data } = await supabase.from("products").select(productSelect).eq("is_deleted", false).order("created_at", { ascending: false }).limit(6);
  return [{ title: "최근 등록된 굿즈", products: (data ?? []).map(productFrom) }];
}

export default async function GoodsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const groups = await getRecommendedGroups();
  return <GoodsSearch recommendedGroups={groups} initialQuery={params.q ?? ""} />;
}
