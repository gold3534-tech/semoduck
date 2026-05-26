import { GoodsSearch, type RecommendedGoodsGroup } from "@/app/goods/search";
import { searchNaverShopping } from "@/lib/external/naver-shopping";
import { productFromDbRow, productSelect } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

export const dynamic = "force-dynamic";

function productFromExternal(item: Awaited<ReturnType<typeof searchNaverShopping>>["items"][number], interest: string): Product {
  return {
    id: `naver-${item.id}`,
    title: item.title,
    normalizedTitle: item.title.toLowerCase(),
    brand: item.brand ?? item.mallName,
    category: item.category ?? interest,
    description: item.category ?? `${interest} 관련 굿즈`,
    image: item.image ?? "/placeholder-goods.svg",
    isOfficialProduct: false,
    tags: [interest, item.category].filter(Boolean) as string[],
    gallerySlugs: [],
    bookmarkCount: 0,
    offers: [
      {
        id: item.id,
        source: "naver_shopping",
        mallName: item.mallName,
        price: item.price,
        shippingFee: item.shippingFee,
        condition: item.condition,
        isOfficial: item.isOfficial,
        isUsed: item.isUsed,
        url: item.url
      }
    ]
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

const ignoredRecommendationInterests = new Set(["굿즈", "덕", "돌"]);
const recommendationTerms: Record<string, string[]> = {
  BTS: ["BTS", "방탄소년단", "Weverse"],
  롤: ["라이엇 스토어", "리그 오브 레전드", "League of Legends", "TFT", "요네", "아리"],
  스텔라이브: ["스텔라이브", "Fanding"],
  지브리: ["지브리", "스튜디오 지브리", "도토리숲", "토토로", "키키", "하울"],
  포켓몬: ["포켓몬", "Pokemon Store"],
  산리오: ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디"],
  애니: ["원피스", "지브리", "피규어", "애니"],
  웹툰: ["웹툰프렌즈", "웹툰"],
  아이돌: ["BTS", "아이돌"],
  게임: ["라이엇 스토어", "포켓몬", "이터널 리턴"],
  캐릭터: ["산리오", "포켓몬", "캐릭터"],
  피규어: ["피규어", "원피스", "라이엇 스토어"],
  버튜버: ["스텔라이브"]
};

function termsForInterest(interest: string) {
  return recommendationTerms[interest] ?? [interest];
}

function scoreProduct(product: Product, interest: string) {
  const terms = termsForInterest(interest).map((term) => term.toLowerCase());
  const text = `${product.title} ${product.brand} ${product.category} ${product.description} ${product.tags.join(" ")}`.toLowerCase();
  return terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
}

function officialRank(product: Product) {
  return Number(product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial));
}

async function getLocalProducts(interest: string, limit: number) {
  const supabase = createDataSupabaseClient();
  const filters = termsForInterest(interest).flatMap((term) => [
    `title.ilike.%${term}%`,
    `brand.ilike.%${term}%`,
    `category.ilike.%${term}%`,
    `description.ilike.%${term}%`
  ]);
  const { data } = await supabase
    .from("products")
    .select(productSelect)
    .or(filters.join(","))
    .order("is_official_product", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);
  const products = (data ?? [])
    .map(productFromDbRow)
    .filter((product) => product.offers.length > 0 && product.image && product.image !== "/placeholder-goods.svg")
    .map((product) => ({ product, score: scoreProduct(product, interest) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || officialRank(b.product) - officialRank(a.product) || b.product.bookmarkCount - a.product.bookmarkCount)
    .map((item) => item.product);
  const official = products.filter((product) => product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial));
  return (official.length ? official : products).slice(0, limit);
}

async function getRecommendedGroups(): Promise<RecommendedGoodsGroup[]> {
  const interests = await getUserInterests();
  const targets = interests.length ? interests.filter((interest) => !ignoredRecommendationInterests.has(interest)).slice(0, 5) : ["산리오", "포켓몬", "원피스"];

  const groups = await Promise.all(
    targets.map(async (interest) => {
      const localProducts = await getLocalProducts(interest, 12);
      if (localProducts.length >= 12) return { title: `${interest} 추천 굿즈`, products: localProducts };

      const external = await searchNaverShopping(`${termsForInterest(interest)[0]} 굿즈`, 12);
      const externalProducts = external.items.slice(0, 12 - localProducts.length).map((item) => productFromExternal(item, interest));
      return { title: `${interest} 추천 굿즈`, products: [...localProducts, ...externalProducts] };
    })
  );

  return groups.filter((group) => group.products.length);
}

export default async function GoodsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const groups = await getRecommendedGroups();
  return <GoodsSearch recommendedGroups={groups} initialQuery={params.q ?? ""} />;
}
