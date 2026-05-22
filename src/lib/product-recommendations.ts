import type { Product } from "@/types/domain";

export type ProductRow = {
  id: string;
  title: string;
  normalized_title: string;
  brand?: string | null;
  category: string;
  description?: string | null;
  image_url?: string | null;
  is_official_product?: boolean | null;
  bookmark_count?: number | null;
  product_offers?: Array<{
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
  }> | null;
};

export const productSelect =
  "id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)";

function fallbackOffer(id: string, query: string, price: number) {
  return {
    id,
    source: "naver_shopping" as const,
    mallName: "네이버 쇼핑",
    price,
    shippingFee: 3000,
    condition: "new" as const,
    isOfficial: false,
    isUsed: false,
    url: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}`
  };
}

const fallbackProducts: Product[] = [
  {
    id: "fallback-bts-photocard",
    title: "BTS 포토카드 바인더",
    normalizedTitle: "bts 포토카드 바인더",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "포토카드 보관과 특전 정리에 어울리는 바인더입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    isOfficialProduct: false,
    tags: ["BTS", "아이돌", "포토카드", "바인더", "굿즈"],
    gallerySlugs: ["bts"],
    bookmarkCount: 418,
    offers: [fallbackOffer("fallback-offer-bts", "BTS 포토카드 바인더", 17500)]
  },
  {
    id: "fallback-pokemon-binder",
    title: "포켓몬 카드 9포켓 바인더",
    normalizedTitle: "포켓몬 카드 9포켓 바인더",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "포켓몬 카드 수집용 바인더와 슬리브를 찾는 팬에게 맞는 상품입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    isOfficialProduct: false,
    tags: ["포켓몬", "게임", "카드", "바인더", "굿즈"],
    gallerySlugs: ["pokemon"],
    bookmarkCount: 220,
    offers: [fallbackOffer("fallback-offer-pokemon", "포켓몬 카드 바인더", 8000)]
  },
  {
    id: "fallback-stellive-album",
    title: "스텔라이브 앨범 굿즈",
    normalizedTitle: "스텔라이브 앨범 굿즈",
    brand: "스텔라이브",
    category: "버튜버굿즈",
    description: "스텔라이브 앨범과 특전 구성을 확인하기 좋은 굿즈입니다.",
    image: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    isOfficialProduct: false,
    tags: ["스텔라이브", "버튜버", "앨범", "특전", "굿즈"],
    gallerySlugs: ["stellive"],
    bookmarkCount: 121,
    offers: [fallbackOffer("fallback-offer-stellive", "스텔라이브 앨범 굿즈", 19800)]
  },
  {
    id: "fallback-t1-uniform",
    title: "T1 롤드컵 유니폼",
    normalizedTitle: "t1 롤드컵 유니폼",
    brand: "T1",
    category: "게임굿즈",
    description: "e스포츠 유니폼을 찾는 팬에게 맞는 상품입니다.",
    image: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    isOfficialProduct: false,
    tags: ["롤", "T1", "게임", "유니폼", "LCK"],
    gallerySlugs: ["lol"],
    bookmarkCount: 201,
    offers: [fallbackOffer("fallback-offer-t1", "T1 롤드컵 유니폼", 45500)]
  },
  {
    id: "fallback-onepiece-figure",
    title: "원피스 루피 기어5 피규어",
    normalizedTitle: "원피스 루피 기어5 피규어",
    brand: "원피스",
    category: "애니굿즈",
    description: "정품 여부와 판매 링크 확인이 중요한 원피스 피규어입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    isOfficialProduct: true,
    tags: ["원피스", "애니", "루피", "피규어", "굿즈"],
    gallerySlugs: ["onepiece"],
    bookmarkCount: 186,
    offers: [fallbackOffer("fallback-offer-onepiece", "원피스 루피 기어5 피규어", 23000)]
  },
  {
    id: "fallback-kuromi-keyring",
    title: "산리오 쿠로미 아크릴 키링",
    normalizedTitle: "산리오 쿠로미 아크릴 키링",
    brand: "산리오",
    category: "캐릭터굿즈",
    description: "쿠로미 팬들이 많이 찾는 키링 굿즈입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    isOfficialProduct: false,
    tags: ["쿠로미", "산리오", "캐릭터", "키링", "굿즈"],
    gallerySlugs: ["sanrio"],
    bookmarkCount: 342,
    offers: [fallbackOffer("fallback-offer-kuromi", "쿠로미 키링", 4900)]
  }
];

const galleryKeywordMap: Record<string, string[]> = {
  sanrio: ["산리오", "쿠로미", "캐릭터", "키링"],
  pokemon: ["포켓몬", "게임", "카드", "바인더"],
  onepiece: ["원피스", "애니", "루피", "피규어"],
  "webtoon-goods": ["웹툰", "아크릴", "팝업"],
  bts: ["BTS", "아이돌", "포토카드", "바인더"],
  stellive: ["스텔라이브", "버튜버", "앨범", "특전"],
  lol: ["롤", "T1", "게임", "유니폼", "LCK"]
};

export function productFromDbRow(row: ProductRow): Product {
  const offers = (row.product_offers ?? [])
    .map((offer) => ({
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
    .sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial) || Number(a.isUsed) - Number(b.isUsed) || a.price - b.price);

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
    offers
  };
}

export function keywordsForPost(input: { title: string; content: string; gallerySlug?: string | null; galleryName?: string | null; tags?: string[] }) {
  const text = `${input.title} ${input.content} ${input.galleryName ?? ""} ${(input.tags ?? []).join(" ")}`.toLowerCase();
  const keywords = new Set<string>([...(input.gallerySlug ? galleryKeywordMap[input.gallerySlug] ?? [] : []), ...(input.tags ?? [])]);
  const candidates = ["쿠로미", "산리오", "키링", "정품", "포켓몬", "카드", "바인더", "원피스", "루피", "피규어", "BTS", "포토카드", "스텔라이브", "롤", "T1", "유니폼", "아크릴", "특전"];

  for (const keyword of candidates) {
    if (text.includes(keyword.toLowerCase())) keywords.add(keyword);
  }

  return [...keywords].filter(Boolean);
}

export function fallbackTags(input: { title: string; content: string; gallerySlug?: string | null; galleryName?: string | null }, limit = 5) {
  return keywordsForPost(input).slice(0, limit);
}

export function relatedProducts(products: Product[], keywords: string[], limit = 4) {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase()).filter(Boolean);
  const scored = products.map((product) => {
    const text = `${product.title} ${product.brand} ${product.category} ${product.description} ${product.tags.join(" ")} ${product.gallerySlugs.join(" ")}`.toLowerCase();
    const score = normalizedKeywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    return { product, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.product.isOfficialProduct) - Number(a.product.isOfficialProduct) || b.product.bookmarkCount - a.product.bookmarkCount)
    .slice(0, limit)
    .map((item) => item.product);
}

export function fallbackRecommendedProducts(keywords: string[] = [], limit = 4) {
  const related = relatedProducts(fallbackProducts, keywords, limit);
  return related
    .concat(fallbackProducts)
    .filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index)
    .slice(0, limit);
}
