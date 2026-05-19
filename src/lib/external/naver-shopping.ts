import type { ProductOffer } from "@/types/domain";

type NaverShoppingItem = {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  productId: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
};

type NaverShoppingResponse = {
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
};

export type NormalizedExternalOffer = Pick<
  ProductOffer,
  "source" | "mallName" | "price" | "shippingFee" | "condition" | "isOfficial" | "isUsed" | "url"
> & {
  id: string;
  title: string;
  image?: string;
  brand?: string;
  category?: string;
};

const allowedCategoryHints = [
  "수집품",
  "완구",
  "인형",
  "피규어",
  "모형",
  "캐릭터",
  "문구",
  "팬시",
  "음반",
  "DVD",
  "블루레이",
  "게임",
  "취미",
  "키덜트",
  "카드",
  "스티커",
  "포토카드",
  "굿즈"
];

const blockedCategoryHints = ["패션의류", "여성의류", "남성의류", "원피스", "식품", "화장품", "생활용품"];
const goodsWords = ["굿즈", "키링", "인형", "피규어", "포토카드", "카드", "앨범", "아크릴", "스티커", "뱃지", "배지", "포스터", "문구"];

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

function normalizeQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return "쿠로미 키링";
  if (goodsWords.some((word) => trimmed.includes(word))) return trimmed;
  return `${trimmed} 굿즈`;
}

function isLikelyFandomGoods(item: NaverShoppingItem) {
  const category = [item.category1, item.category2, item.category3, item.category4].filter(Boolean).join(" > ");
  const title = stripHtml(item.title);
  if (blockedCategoryHints.some((hint) => category.includes(hint))) return false;
  if (allowedCategoryHints.some((hint) => category.includes(hint) || title.includes(hint))) return true;
  return goodsWords.some((word) => title.includes(word));
}

export async function searchNaverShopping(
  query: string,
  display = 20,
  start = 1
): Promise<{ items: NormalizedExternalOffer[]; usedMock: boolean; error?: string; total: number; query: string }> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const normalizedQuery = normalizeQuery(query);

  if (!clientId || !clientSecret) {
    return { items: [], usedMock: false, error: "네이버 API 키가 설정되지 않았습니다.", total: 0, query: normalizedQuery };
  }

  try {
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", normalizedQuery);
    url.searchParams.set("display", String(Math.min(Math.max(display, 1), 100)));
    url.searchParams.set("start", String(Math.min(Math.max(start, 1), 1000)));
    url.searchParams.set("sort", "sim");

    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      },
      next: { revalidate: 60 * 10 }
    });

    if (!response.ok) {
      return { items: [], usedMock: false, error: `네이버 API 오류 ${response.status}`, total: 0, query: normalizedQuery };
    }

    const data = (await response.json()) as NaverShoppingResponse;
    const items = data.items.filter(isLikelyFandomGoods).map((item) => ({
      id: item.productId || item.link,
      title: stripHtml(item.title),
      image: item.image,
      brand: item.brand || item.maker,
      category: [item.category1, item.category2, item.category3, item.category4].filter(Boolean).join(" > "),
      source: "naver_shopping" as const,
      mallName: item.mallName || "네이버 쇼핑",
      price: Number(item.lprice || 0),
      shippingFee: 0,
      condition: "new" as const,
      isOfficial: false,
      isUsed: false,
      url: item.link
    }));

    return { items, usedMock: false, total: data.total, query: normalizedQuery };
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { items: [], usedMock: false, error: message, total: 0, query: normalizedQuery };
  }
}
