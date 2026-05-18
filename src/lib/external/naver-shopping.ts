import { products } from "@/lib/mock-data";
import type { ProductOffer } from "@/types/domain";

type NaverShoppingItem = {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
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

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

function mockOffers(query: string): NormalizedExternalOffer[] {
  return products.flatMap((product) =>
    product.offers
      .filter((offer) => offer.source === "naver_shopping")
      .map((offer) => ({
        id: offer.id,
        title: `${product.title} mock`,
        image: product.image,
        brand: product.brand,
        category: product.category,
        source: "naver_shopping",
        mallName: offer.mallName,
        price: offer.price,
        shippingFee: offer.shippingFee,
        condition: offer.condition,
        isOfficial: offer.isOfficial,
        isUsed: offer.isUsed,
        url: offer.url.includes("query=") ? offer.url : `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}`
      }))
  );
}

export async function searchNaverShopping(query: string, display = 8): Promise<{ items: NormalizedExternalOffer[]; usedMock: boolean; error?: string }> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { items: mockOffers(query), usedMock: true, error: "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없습니다." };
  }

  try {
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", String(display));
    url.searchParams.set("sort", "sim");

    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      },
      next: { revalidate: 60 * 10 }
    });

    if (!response.ok) {
      return { items: mockOffers(query), usedMock: true, error: `Naver API ${response.status}` };
    }

    const data = (await response.json()) as NaverShoppingResponse;
    const items = data.items.map((item) => ({
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

    return { items, usedMock: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { items: mockOffers(query), usedMock: true, error: message };
  }
}
