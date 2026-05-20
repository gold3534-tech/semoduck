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

const fallbackProducts: Product[] = [
  {
    id: "naver-fallback-kuromi-keyring",
    title: "산리오 쿠로미 아크릴 키링",
    normalizedTitle: "산리오 쿠로미 아크릴 키링",
    brand: "산리오",
    category: "캐릭터굿즈",
    description: "쿠로미 팬들이 많이 찾는 키링 굿즈입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    isOfficialProduct: false,
    tags: ["쿠로미", "산리오", "키링", "아크릴", "정품"],
    gallerySlugs: ["sanrio"],
    bookmarkCount: 342,
    offers: [
      {
        id: "fallback-offer-kuromi-keyring",
        source: "naver_shopping",
        mallName: "네이버 쇼핑",
        price: 4900,
        shippingFee: 3000,
        condition: "new",
        isOfficial: false,
        isUsed: false,
        specialBenefit: "예약 특전 확인",
        url: "https://search.shopping.naver.com/search/all?query=%EC%BF%A0%EB%A1%9C%EB%AF%B8%20%ED%82%A4%EB%A7%81"
      }
    ]
  },
  {
    id: "naver-fallback-pokemon-binder",
    title: "포켓몬 카드 9포켓 바인더",
    normalizedTitle: "포켓몬 카드 9포켓 바인더",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "카드 수집용 바인더와 슬리브를 찾는 팬에게 맞는 상품입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    isOfficialProduct: false,
    tags: ["포켓몬", "카드", "바인더", "수집"],
    gallerySlugs: ["pokemon"],
    bookmarkCount: 220,
    offers: [
      {
        id: "fallback-offer-pokemon-binder",
        source: "naver_shopping",
        mallName: "네이버 쇼핑",
        price: 8000,
        shippingFee: 3000,
        condition: "new",
        isOfficial: false,
        isUsed: false,
        url: "https://search.shopping.naver.com/search/all?query=%ED%8F%AC%EC%BC%93%EB%AA%AC%20%EC%B9%B4%EB%93%9C%20%EB%B0%94%EC%9D%B8%EB%8D%94"
      }
    ]
  },
  {
    id: "naver-fallback-bts-photocard",
    title: "BTS 포토카드 바인더",
    normalizedTitle: "BTS 포토카드 바인더",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "포토카드 보관과 특전 정리에 어울리는 바인더입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    isOfficialProduct: false,
    tags: ["BTS", "포토카드", "바인더", "특전"],
    gallerySlugs: ["bts"],
    bookmarkCount: 418,
    offers: [
      {
        id: "fallback-offer-bts-photocard",
        source: "naver_shopping",
        mallName: "네이버 쇼핑",
        price: 17500,
        shippingFee: 3000,
        condition: "new",
        isOfficial: false,
        isUsed: false,
        url: "https://search.shopping.naver.com/search/all?query=BTS%20%ED%8F%AC%ED%86%A0%EC%B9%B4%EB%93%9C%20%EB%B0%94%EC%9D%B8%EB%8D%94"
      }
    ]
  },
  {
    id: "naver-fallback-onepiece-figure",
    title: "원피스 루피 기어5 피규어",
    normalizedTitle: "원피스 루피 기어5 피규어",
    brand: "원피스",
    category: "애니굿즈",
    description: "정품 여부와 판매처 확인이 중요한 원피스 피규어입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    isOfficialProduct: true,
    tags: ["원피스", "루피", "피규어", "정품"],
    gallerySlugs: ["onepiece"],
    bookmarkCount: 186,
    offers: [
      {
        id: "fallback-offer-onepiece-figure",
        source: "naver_shopping",
        mallName: "네이버 쇼핑",
        price: 23000,
        shippingFee: 3000,
        condition: "new",
        isOfficial: true,
        isUsed: false,
        url: "https://search.shopping.naver.com/search/all?query=%EC%9B%90%ED%94%BC%EC%8A%A4%20%EB%A3%A8%ED%94%BC%20%EA%B8%B0%EC%96%B45%20%ED%94%BC%EA%B7%9C%EC%96%B4"
      }
    ]
  },
  {
    id: "naver-fallback-stellive-album",
    title: "스텔라이브 앨범 굿즈",
    normalizedTitle: "스텔라이브 앨범 굿즈",
    brand: "스텔라이브",
    category: "버튜버굿즈",
    description: "앨범과 특전 구성을 함께 확인하기 좋은 굿즈입니다.",
    image: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    isOfficialProduct: false,
    tags: ["스텔라이브", "앨범", "특전", "버튜버"],
    gallerySlugs: ["stellive"],
    bookmarkCount: 121,
    offers: [
      {
        id: "fallback-offer-stellive-album",
        source: "naver_shopping",
        mallName: "네이버 쇼핑",
        price: 19800,
        shippingFee: 3000,
        condition: "new",
        isOfficial: false,
        isUsed: false,
        url: "https://search.shopping.naver.com/search/all?query=%EC%8A%A4%ED%85%94%EB%9D%BC%EC%9D%B4%EB%B8%8C%20%EC%95%A8%EB%B2%94%20%EA%B5%BF%EC%A6%88"
      }
    ]
  },
  {
    id: "naver-fallback-lol-uniform",
    title: "T1 롤드컵 유니폼",
    normalizedTitle: "T1 롤드컵 유니폼",
    brand: "T1",
    category: "게임굿즈",
    description: "사이즈와 판매처 확인이 필요한 e스포츠 유니폼입니다.",
    image: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    isOfficialProduct: false,
    tags: ["롤", "T1", "유니폼", "LCK"],
    gallerySlugs: ["lol"],
    bookmarkCount: 201,
    offers: [
      {
        id: "fallback-offer-lol-uniform",
        source: "naver_shopping",
        mallName: "네이버 쇼핑",
        price: 45500,
        shippingFee: 3000,
        condition: "new",
        isOfficial: false,
        isUsed: false,
        url: "https://search.shopping.naver.com/search/all?query=T1%20%EB%A1%A4%EB%93%9C%EC%BB%B5%20%EC%9C%A0%EB%8B%88%ED%8F%BC"
      }
    ]
  }
];

const galleryKeywordMap: Record<string, string[]> = {
  sanrio: ["산리오", "쿠로미", "키링", "아크릴"],
  pokemon: ["포켓몬", "카드", "바인더"],
  onepiece: ["원피스", "루피", "피규어"],
  "webtoon-goods": ["웹툰", "아크릴", "챰", "팝업"],
  bts: ["BTS", "포토카드", "바인더"],
  stellive: ["스텔라이브", "앨범", "특전"],
  lol: ["롤", "T1", "유니폼", "LCK"]
};

export function productFromDbRow(row: ProductRow): Product {
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
    offers: (row.product_offers ?? []).map((offer) => ({
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

export function keywordsForPost(input: { title: string; content: string; gallerySlug?: string | null; galleryName?: string | null; tags?: string[] }) {
  const text = `${input.title} ${input.content} ${input.galleryName ?? ""} ${(input.tags ?? []).join(" ")}`.toLowerCase();
  const keywords = new Set<string>([...(input.gallerySlug ? galleryKeywordMap[input.gallerySlug] ?? [] : []), ...(input.tags ?? [])]);

  const candidates = ["쿠로미", "산리오", "키링", "정품", "예약특전", "포켓몬", "카드", "바인더", "원피스", "루피", "피규어", "BTS", "포토카드", "스텔라이브", "롤", "T1", "유니폼", "아크릴", "챰"];
  for (const keyword of candidates) {
    if (text.includes(keyword.toLowerCase())) keywords.add(keyword);
  }

  return [...keywords].filter(Boolean);
}

export function fallbackTags(input: { title: string; content: string; gallerySlug?: string | null; galleryName?: string | null }, limit = 5) {
  const keywords = keywordsForPost(input);
  return keywords.slice(0, limit);
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
    .sort((a, b) => b.score - a.score || b.product.bookmarkCount - a.product.bookmarkCount)
    .slice(0, limit)
    .map((item) => item.product);
}

export function fallbackRecommendedProducts(keywords: string[] = [], limit = 4) {
  return relatedProducts(fallbackProducts, keywords, limit).concat(fallbackProducts).filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index).slice(0, limit);
}
