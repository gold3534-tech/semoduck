import { GoodsSearch } from "@/app/goods/search";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import type { Product } from "@/types/domain";

async function getProducts(): Promise<Product[]> {
  const admin = createDataSupabaseClient();
  const { data } = await admin
    .from("products")
    .select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)")
    .order("created_at", { ascending: false })
    .limit(9);

  return (data ?? []).map((product) => ({
    id: product.id,
    title: product.title,
    normalizedTitle: product.normalized_title,
    brand: product.brand ?? "",
    category: product.category,
    description: product.description ?? "",
    image: product.image_url ?? "/placeholder-goods.svg",
    isOfficialProduct: product.is_official_product ?? false,
    tags: [product.category, product.brand].filter(Boolean) as string[],
    gallerySlugs: [],
    bookmarkCount: product.bookmark_count ?? 0,
    offers: ((product.product_offers ?? []) as Array<{
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
  }));
}

export default async function GoodsPage() {
  const products = await getProducts();
  return <GoodsSearch products={products} />;
}
