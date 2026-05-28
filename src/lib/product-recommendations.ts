import type { Product, ProductOffer } from "@/types/domain";

type ProductOfferRow = {
  id?: string | null;
  product_id?: string | null;
  source?: string | null;
  mall_name?: string | null;
  price?: number | string | null;
  shipping_fee?: number | string | null;
  condition?: string | null;
  is_official?: boolean | null;
  is_used?: boolean | null;
  special_benefit?: string | null;
  url?: string | null;
};

type ProductDbRow = {
  id: string;
  title: string;
  normalized_title?: string | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
  is_official_product?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  bookmark_count?: number | null;
  product_offers?: ProductOfferRow[] | ProductOfferRow | null;
  offers?: ProductOfferRow[] | ProductOfferRow | null;
};

export const productSelect = `
  id,
  title,
  normalized_title,
  brand,
  category,
  description,
  image_url,
  is_official_product,
  created_at,
  updated_at,
  product_offers (
    id,
    product_id,
    source,
    mall_name,
    price,
    shipping_fee,
    condition,
    is_official,
    is_used,
    special_benefit,
    url
  )
`;

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeArray<T>(value: T[] | T | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanTag(value: string | null | undefined) {
  return value?.trim().replace(/^#/, "") ?? "";
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function normalizeOfferSource(
  source: string | null | undefined,
  isOfficial?: boolean | null,
  isUsed?: boolean | null
): ProductOffer["source"] {
  const value = source?.trim();

  if (
    value === "official_shop" ||
    value === "naver_shopping" ||
    value === "coupang" ||
    value === "user_submission" ||
    value === "internal_market" ||
    value === "external_search"
  ) {
    return value;
  }

  if (
    value === "official" ||
    value === "official_mall" ||
    value === "official_store" ||
    value === "brand_shop" ||
    value === "brand_store"
  ) {
    return "official_shop";
  }

  if (
    value === "naver" ||
    value === "naver_shop" ||
    value === "naver_store" ||
    value === "shopping"
  ) {
    return "naver_shopping";
  }

  if (value === "user" || value === "market" || value === "used") {
    return "internal_market";
  }

  if (isOfficial) return "official_shop";
  if (isUsed) return "internal_market";

  return "external_search";
}

function normalizeOfferCondition(
  condition: string | null | undefined
): ProductOffer["condition"] {
  const value = condition?.trim();

  if (
    value === "new" ||
    value === "used" ||
    value === "opened_unused" ||
    value === "damaged" ||
    value === "unknown"
  ) {
    return value;
  }

  return "unknown";
}

function guessGallerySlugs(row: ProductDbRow) {
  const text = `${row.title ?? ""} ${row.brand ?? ""} ${row.category ?? ""} ${
    row.description ?? ""
  }`.toLowerCase();

  const slugs: string[] = [];

  if (text.includes("bts") || text.includes("방탄")) {
    slugs.push("bts");
  }

  if (text.includes("포켓몬") || text.includes("pokemon")) {
    slugs.push("pokemon");
  }

  if (
    text.includes("산리오") ||
    text.includes("쿠로미") ||
    text.includes("시나모롤") ||
    text.includes("헬로키티") ||
    text.includes("마이멜로디") ||
    text.includes("폼폼푸린") ||
    text.includes("포차코")
  ) {
    slugs.push("sanrio");
  }

  if (
    text.includes("롤") ||
    text.includes("리그오브레전드") ||
    text.includes("리그 오브 레전드") ||
    text.includes("league of legends") ||
    text.includes("라이엇")
  ) {
    slugs.push("lol");
  }

  if (text.includes("스텔라이브") || text.includes("stellive")) {
    slugs.push("stellive");
  }

  if (text.includes("원피스") || text.includes("one piece")) {
    slugs.push("onepiece");
  }

  if (
    text.includes("지브리") ||
    text.includes("ghibli") ||
    text.includes("토토로") ||
    text.includes("키키") ||
    text.includes("하울")
  ) {
    slugs.push("ghibli");
  }

  return unique(slugs);
}

function offerFromRow(row: ProductOfferRow): ProductOffer {
  return {
    id: row.id ?? "",
    source: normalizeOfferSource(row.source, row.is_official, row.is_used),
    mallName: row.mall_name ?? row.source ?? "판매처",
    price: toNumber(row.price),
    shippingFee: toNumber(row.shipping_fee),
    condition: normalizeOfferCondition(row.condition),
    isOfficial: Boolean(row.is_official),
    isUsed: Boolean(row.is_used),
    specialBenefit: row.special_benefit ?? undefined,
    url: row.url ?? "",
  };
}

export function productFromDbRow(row: ProductDbRow): Product {
  const rawOffers = normalizeArray(row.product_offers ?? row.offers);

  const offers = rawOffers
    .map(offerFromRow)
    .filter((offer) => offer.id || offer.url || offer.mallName);

  const title = row.title ?? "이름 없는 굿즈";
  const brand = row.brand ?? "";
  const category = row.category ?? "";
  const description = row.description ?? "";
  const image = row.image_url || "/placeholder-goods.svg";
  const gallerySlugs = guessGallerySlugs(row);

  const tags = unique([
    cleanTag(brand),
    cleanTag(category),
    ...gallerySlugs,
  ]);

  const isOfficialProduct =
    Boolean(row.is_official_product) ||
    offers.some((offer) => offer.isOfficial);

  return {
    id: row.id,
    title,
    normalizedTitle: row.normalized_title || normalizeTitle(title),
    brand,
    category,
    description,
    image,
    isOfficialProduct,
    tags,
    gallerySlugs,
    bookmarkCount: row.bookmark_count ?? 0,
    offers,
  };
}

export function productPrice(product: Product) {
  const prices = product.offers
    .map((offer) => offer.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

export function fallbackTags({
  title,
  content,
  gallerySlug,
  galleryName,
}: {
  title?: string | null;
  content?: string | null;
  gallerySlug?: string | null;
  galleryName?: string | null;
}) {
  const text = `${title ?? ""} ${content ?? ""} ${gallerySlug ?? ""} ${
    galleryName ?? ""
  }`.toLowerCase();

  const tags: string[] = [];

  if (galleryName) tags.push(galleryName);
  if (gallerySlug) tags.push(gallerySlug);

  if (text.includes("bts") || text.includes("방탄")) tags.push("BTS");
  if (text.includes("포켓몬") || text.includes("pokemon")) tags.push("포켓몬");
  if (text.includes("산리오")) tags.push("산리오");
  if (text.includes("쿠로미")) tags.push("쿠로미");
  if (text.includes("시나모롤")) tags.push("시나모롤");
  if (text.includes("롤") || text.includes("리그")) tags.push("롤");
  if (text.includes("스텔라이브")) tags.push("스텔라이브");
  if (text.includes("원피스")) tags.push("원피스");
  if (text.includes("지브리")) tags.push("지브리");

  if (text.includes("피규어")) tags.push("피규어");
  if (text.includes("키링")) tags.push("키링");
  if (text.includes("포카") || text.includes("포토카드")) tags.push("포카");
  if (text.includes("바인더")) tags.push("바인더");
  if (text.includes("인형")) tags.push("인형");
  if (text.includes("아크릴")) tags.push("아크릴");
  if (text.includes("유니폼")) tags.push("유니폼");
  if (text.includes("오르골")) tags.push("오르골");

  return unique(tags).slice(0, 8);
}

export function keywordsForPost({
  title,
  content,
  gallerySlug,
  galleryName,
  tags = [],
}: {
  title?: string | null;
  content?: string | null;
  gallerySlug?: string | null;
  galleryName?: string | null;
  tags?: string[];
}) {
  const base = fallbackTags({
    title,
    content,
    gallerySlug,
    galleryName,
  });

  return unique([
    ...tags,
    ...base,
    title ?? "",
    galleryName ?? "",
    gallerySlug ?? "",
  ]).slice(0, 12);
}

/**
 * 실제 추천에는 쓰지 않는 것을 권장.
 * 기존 코드에서 아직 import 중일 수 있어서 빌드 호환용으로 남겨둠.
 */
export function fallbackRecommendedProducts(
  interests: string[] = [],
  count = 4
): Product[] {
  const keyword = interests[0] ?? "굿즈";

  const fallbackProducts: Product[] = [
    {
      id: "fallback-kuromi-keyring",
      title: "쿠로미 키링",
      normalizedTitle: "쿠로미 키링",
      brand: "산리오",
      category: "키링",
      description: "fallback display item",
      image: "/placeholder-goods.svg",
      isOfficialProduct: false,
      tags: ["산리오", "쿠로미", "키링"],
      gallerySlugs: ["sanrio"],
      bookmarkCount: 0,
      offers: [],
    },
    {
      id: "fallback-pokemon-binder",
      title: "포켓몬 카드 바인더",
      normalizedTitle: "포켓몬 카드 바인더",
      brand: "포켓몬",
      category: "바인더",
      description: "fallback display item",
      image: "/placeholder-goods.svg",
      isOfficialProduct: false,
      tags: ["포켓몬", "바인더"],
      gallerySlugs: ["pokemon"],
      bookmarkCount: 0,
      offers: [],
    },
    {
      id: "fallback-bts-photocard-binder",
      title: "BTS 포토카드 바인더",
      normalizedTitle: "bts 포토카드 바인더",
      brand: "BTS",
      category: "바인더",
      description: "fallback display item",
      image: "/placeholder-goods.svg",
      isOfficialProduct: false,
      tags: ["BTS", "포카", "바인더"],
      gallerySlugs: ["bts"],
      bookmarkCount: 0,
      offers: [],
    },
    {
      id: "fallback-ghibli-musicbox",
      title: "지브리 오르골",
      normalizedTitle: "지브리 오르골",
      brand: "지브리",
      category: "오르골",
      description: "fallback display item",
      image: "/placeholder-goods.svg",
      isOfficialProduct: false,
      tags: ["지브리", "오르골"],
      gallerySlugs: ["ghibli"],
      bookmarkCount: 0,
      offers: [],
    },
  ];

  return fallbackProducts
    .filter((product) => {
      if (!keyword) return true;

      const text = `${product.title} ${product.brand} ${
        product.category
      } ${product.tags.join(" ")}`.toLowerCase();

      return text.includes(keyword.toLowerCase()) || interests.length === 0;
    })
    .slice(0, count);
}