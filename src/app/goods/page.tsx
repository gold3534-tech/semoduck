import { GoodsSearch, type RecommendedGoodsGroup } from "@/app/goods/search";
import { searchNaverShopping } from "@/lib/external/naver-shopping";
import { productFromDbRow, productSelect } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const groupSize = 10;

const recommendationTerms: Record<string, string[]> = {
  BTS: ["BTS", "방탄소년단", "방탄", "BT21", "Weverse"],
  롤: ["리그오브레전드", "리그 오브 레전드", "League of Legends", "LoL", "라이엇", "TFT", "아리", "요네", "징크스"],
  스텔라이브: ["스텔라이브", "Stellive", "Fanding"],
  지브리: ["지브리", "스튜디오 지브리", "Studio Ghibli", "도토리숲", "토토로", "키키", "하울", "치히로"],
  포켓몬: ["포켓몬", "Pokemon", "피카츄", "이상해씨", "파이리", "꼬부기"],
  산리오: ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  원피스: ["원피스", "One Piece", "루피", "조로", "상디", "쵸파", "나미"],
  웹툰: ["웹툰프렌즈", "웹툰", "WEBTOON FRIENDS"],
  아이돌: ["BTS", "방탄소년단", "아이돌"],
  게임: ["포켓몬", "리그오브레전드", "라이엇", "이터널리턴"],
  캐릭터: ["산리오", "포켓몬", "캐릭터"],
  피규어: ["피규어", "원피스", "루피", "포켓몬"],
  버튜버: ["스텔라이브", "Stellive"]
};

const conflictTerms: Record<string, string[]> = {
  BTS: ["포켓몬", "Pokemon", "원피스", "One Piece", "지브리", "리그오브레전드", "스텔라이브"],
  포켓몬: ["원피스", "One Piece", "지브리", "토토로", "리그오브레전드", "BTS", "방탄", "스텔라이브"],
  원피스: ["포켓몬", "Pokemon", "지브리", "토토로", "리그오브레전드", "BTS", "방탄", "스텔라이브"],
  지브리: ["포켓몬", "Pokemon", "원피스", "One Piece", "리그오브레전드", "BTS", "방탄", "스텔라이브"],
  롤: ["포켓몬", "Pokemon", "원피스", "One Piece", "지브리", "BTS", "방탄", "스텔라이브"],
  스텔라이브: ["포켓몬", "Pokemon", "원피스", "One Piece", "지브리", "리그오브레전드", "BTS", "방탄"]
};

function productFromExternal(item: Awaited<ReturnType<typeof searchNaverShopping>>["items"][number], interest: string): Product {
  return {
    id: `naver-${item.id}`,
    title: item.title,
    normalizedTitle: item.title.toLowerCase(),
    brand: item.brand ?? item.mallName,
    category: item.category ?? interest,
    description: item.category ?? `${interest} 관련 굿즈`,
    image: item.image ?? "/placeholder-goods.svg",
    isOfficialProduct: item.isOfficial,
    tags: [interest, item.category].filter(Boolean) as string[],
    gallerySlugs: [],
    bookmarkCount: 0,
    offers: [
      {
        id: item.id,
        source: item.source,
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
  if (!auth.user) return { interests: [], isLoggedIn: false };

  const supabase = createDataSupabaseClient();
  const { data } = await supabase.from("user_interests").select("interests(name)").eq("user_id", auth.user.id);
  const interests = (data ?? [])
    .map((row: any) => {
      const interest = Array.isArray(row.interests) ? row.interests[0] : row.interests;
      return interest?.name as string | undefined;
    })
    .filter(Boolean) as string[];
  return { interests, isLoggedIn: true };
}

function termsForInterest(interest: string) {
  return recommendationTerms[interest] ?? [interest];
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function includesAny(text: string, terms: string[]) {
  const compactText = normalize(text);
  return terms.some((term) => compactText.includes(normalize(term)));
}

function targetMatchedText(product: Product) {
  return `${product.title} ${product.normalizedTitle} ${product.brand}`.trim();
}

function isFalseOnePieceFashion(product: Product, terms: string[]) {
  const text = `${product.title} ${product.category}`.toLowerCase();
  const matchedOnlyOnePieceWord = includesAny(text, ["원피스"]) && !includesAny(text, terms.filter((term) => !["원피스", "One Piece"].includes(term)));
  return matchedOnlyOnePieceWord && /의류|패션|여성|여아|드레스|치마|블라우스|코디|원피스\s*(옷|드레스)?/i.test(text);
}

function isRelevantProduct(product: Product, interest: string) {
  const terms = termsForInterest(interest);
  const titleBrand = targetMatchedText(product);
  if (!includesAny(titleBrand, terms)) return false;
  if (includesAny(titleBrand, conflictTerms[interest] ?? [])) return false;
  if (interest === "원피스" && isFalseOnePieceFashion(product, terms)) return false;
  return true;
}

function scoreProduct(product: Product, interest: string) {
  const terms = termsForInterest(interest);
  const titleBrand = targetMatchedText(product);
  const fullText = `${titleBrand} ${product.category} ${product.description} ${product.tags.join(" ")}`;
  const titleScore = terms.reduce((sum, term) => sum + (includesAny(titleBrand, [term]) ? 3 : 0), 0);
  const fullScore = terms.reduce((sum, term) => sum + (includesAny(fullText, [term]) ? 1 : 0), 0);
  return titleScore + fullScore;
}

function officialRank(product: Product) {
  return Number(product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial));
}

function seededValue(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function shuffleDaily<T extends { id: string }>(items: T[], interest: string, bucket: string) {
  const day = new Date().toISOString().slice(0, 10);
  return [...items].sort((a, b) => seededValue(`${day}:${interest}:${bucket}:${a.id}`) - seededValue(`${day}:${interest}:${bucket}:${b.id}`));
}

async function getLocalProducts(interest: string) {
  const supabase = createDataSupabaseClient();
  const filters = termsForInterest(interest).flatMap((term) => [`title.ilike.%${term}%`, `brand.ilike.%${term}%`]);
  const { data } = await supabase
    .from("products")
    .select(productSelect)
    .or(filters.join(","))
    .order("is_official_product", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(160);

  return (data ?? [])
    .map(productFromDbRow)
    .filter((product) => product.offers.length > 0 && product.image && product.image !== "/placeholder-goods.svg")
    .filter((product) => isRelevantProduct(product, interest))
    .map((product) => ({ product, score: scoreProduct(product, interest) }))
    .sort((a, b) => b.score - a.score || officialRank(b.product) - officialRank(a.product) || b.product.bookmarkCount - a.product.bookmarkCount)
    .map((item) => item.product);
}

async function getExternalProducts(interest: string) {
  const terms = termsForInterest(interest);
  const external = await searchNaverShopping(`${terms[0]} 굿즈`, 40);
  return external.items.map((item) => productFromExternal(item, interest)).filter((product) => isRelevantProduct(product, interest));
}

function mergeProducts(interest: string, localProducts: Product[], externalProducts: Product[]) {
  const official = shuffleDaily(
    localProducts.filter((product) => officialRank(product)),
    interest,
    "official"
  ).slice(0, 4);
  const localOther = shuffleDaily(
    localProducts.filter((product) => !officialRank(product)),
    interest,
    "local"
  );
  const external = shuffleDaily(externalProducts, interest, "external").slice(0, 4);
  const seen = new Set<string>();
  const primaryMix = [...official, ...external, ...localOther.slice(0, 2)];
  const backfill = shuffleDaily([...localProducts, ...externalProducts], interest, "backfill");

  return [...primaryMix, ...backfill]
    .filter((product) => {
      const key = normalize(product.title).replace(/[^\p{L}\p{N}]+/gu, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, groupSize);
}

async function getRecommendedGroups(): Promise<RecommendedGoodsGroup[]> {
  const { interests, isLoggedIn } = await getUserInterests();
  const ignoredInterests = new Set(["굿즈", "덕", "돌"]);
  const fallbackThemes = Object.keys(recommendationTerms).filter((interest) => !ignoredInterests.has(interest));
  const randomFallbackThemes = [...fallbackThemes].sort(() => Math.random() - 0.5).slice(0, 3);
  const targets = isLoggedIn
    ? interests.filter((interest) => !ignoredInterests.has(interest)).slice(0, 5)
    : randomFallbackThemes;

  const groups = await Promise.all(
    targets.map(async (interest) => {
      const [localProducts, externalProducts] = await Promise.all([getLocalProducts(interest), getExternalProducts(interest)]);
      return { title: `${interest} 추천 굿즈`, products: mergeProducts(interest, localProducts, externalProducts) };
    })
  );

  return groups.filter((group) => group.products.length);
}

export default async function GoodsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const groups = await getRecommendedGroups();
  return <GoodsSearch recommendedGroups={groups} initialQuery={params.q ?? ""} />;
}
