import { officialProductCandidates, type OfficialProductCandidate } from "@/lib/official-product-imports";

type CollectSource = {
  gallerySlug: string;
  brand: string;
  category: string;
  mallName: string;
  url: string;
  urls?: string[];
  titleKeywords: string[];
};

type NaverCollectOptions = {
  query: string;
  gallerySlug: string;
  brand: string;
  category: string;
  mallNames: string[];
  limit?: number;
  itemFilter?: (item: NaverShoppingItem) => boolean;
};

export type OfficialShopCollectResult = {
  items: OfficialProductCandidate[];
  skipped: Array<{ gallerySlug: string; mallName: string; reason: string }>;
};

const riotStoreCategoryUrl =
  "https://brand.naver.com/riot-store/category/f65ad626f5db4ea187f5a804dd2ce156?st=POPULAR&dt=BIG_IMAGE&page=1&size=40";

const sanrioCandidate: OfficialProductCandidate = {
  key: "sanrio-official-brand-search",
  gallerySlug: "sanrio",
  title: "산리오 공식 브랜드스토어 상품",
  brand: "산리오",
  category: "캐릭터굿즈",
  description: "네이버 쇼핑 공식 브랜드스토어 필터로 확인하는 산리오 상품 후보입니다.",
  mallName: "네이버 공식 브랜드스토어 검색",
  price: 0,
  shippingFee: 0,
  url: "https://search.shopping.naver.com/ns/search?query=%EC%82%B0%EB%A6%AC%EC%98%A4&mallTypes=OFFICIAL_BRAND",
  source: "naver_shopping",
  availabilityLabel: "공식 브랜드스토어"
};

const staticFallbacksByGallery = new Map(
  officialProductCandidates.map((candidate) => [candidate.gallerySlug, candidate])
);

const htmlSources: CollectSource[] = [
  {
    gallerySlug: "onepiece",
    brand: "원피스",
    category: "애니굿즈",
    mallName: "대원샵",
    url: "https://www.daewonshop.com/",
    titleKeywords: ["원피스", "루피", "조로", "상디", "쵸파", "피규어", "굿즈"]
  },
  {
    gallerySlug: "eternal-return",
    brand: "이터널 리턴",
    category: "게임굿즈",
    mallName: "ESTAR EGG",
    url: "https://estar-egg.com/product/list.html?cate_no=43",
    urls: [
      "https://estar-egg.com/product/list.html?cate_no=43&page=1",
      "https://estar-egg.com/product/list.html?cate_no=43&page=2",
      "https://estar-egg.com/product/list.html?cate_no=43&page=3",
      "https://estar-egg.com/product/list.html?cate_no=43&page=4",
      "https://estar-egg.com/product/list.html?cate_no=43&page=5"
    ],
    titleKeywords: ["이터널 리턴", "이터널리턴", "굿즈", "아크릴", "키링", "응원봉"]
  }
];

const saleEndedPatterns = [
  /판매\s*종료/i,
  /판매\s*마감/i,
  /판매기간\s*종료/i,
  /예약\s*종료/i,
  /예약\s*마감/i,
  /주문\s*마감/i,
  /접수\s*마감/i,
  /마감되었습니다/i,
  /종료된\s*상품/i,
  /판매가\s*종료/i,
  /sale\s*ended/i,
  /sales?\s*closed/i,
  /order\s*closed/i,
  /pre-?order\s*closed/i,
  /販売終了/i,
  /予約終了/i,
  /受付終了/i
];

const availabilityPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "품절", pattern: /품절|sold\s*out|일시품절|out\s*of\s*stock|売り切れ/i },
  { label: "판매예정", pattern: /판매\s*예정|오픈\s*예정|출시\s*예정|coming\s*soon|販売予定|発売予定/i },
  { label: "예약판매", pattern: /예약\s*판매|예약\s*구매|pre-?order|사전\s*예약|予約販売|予約受付/i },
  { label: "판매중", pattern: /판매중|구매하기|장바구니|buy\s*now|販売中/i }
];

function toAbsoluteUrl(baseUrl: string, value?: string | null) {
  if (!value || value.startsWith("data:")) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, ""));
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  );
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? "";
}

function parsePrice(value: string) {
  const match = value.replace(/,/g, "").match(/(\d{3,})\s*원/);
  return match ? Number(match[1]) : 0;
}

function isSaleEnded(value: string) {
  return saleEndedPatterns.some((pattern) => pattern.test(value));
}

function availabilityLabel(value: string) {
  return availabilityPatterns.find(({ pattern }) => pattern.test(value))?.label;
}

function scoreTitle(title: string, keywords: string[]) {
  const lowered = title.toLowerCase();
  return keywords.filter((keyword) => lowered.includes(keyword.toLowerCase())).length;
}

function uniqueByKeyOrUrl(items: OfficialProductCandidate[]) {
  const deduped = new Map<string, OfficialProductCandidate>();
  for (const item of items) {
    deduped.set(item.key || item.url, item);
  }
  return [...deduped.values()];
}

function productKey(gallerySlug: string, url: string) {
  return `${gallerySlug}-${Buffer.from(url).toString("base64url").slice(0, 18)}`;
}

function extractCandidates(source: CollectSource, html: string) {
  const items: OfficialProductCandidate[] = [];
  const seen = new Set<string>();
  const anchors = [...html.matchAll(/<a\b[^>]*href=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi)];

  for (const match of anchors) {
    const anchorHtml = match[0];
    const index = match.index ?? 0;
    const contextHtml = html.slice(Math.max(0, index - 800), Math.min(html.length, index + anchorHtml.length + 1200));
    const contextText = stripTags(contextHtml);
    if (isSaleEnded(contextText)) continue;

    const href = attr(anchorHtml, "href");
    const url = toAbsoluteUrl(source.url, href);
    if (!url || seen.has(url)) continue;

    const imageTag = anchorHtml.match(/<img\b[^>]*>/i)?.[0] ?? "";
    const imageUrl = toAbsoluteUrl(source.url, attr(imageTag, "src") || attr(imageTag, "data-src") || attr(imageTag, "data-original"));
    const imageTitle = attr(imageTag, "alt") || attr(imageTag, "title");
    const textTitle = stripTags(anchorHtml);
    const title = decodeHtml(imageTitle || textTitle).replace(/\s*(품절|sold out|new|best)\s*/gi, " ").trim();

    if (title.length < 3) continue;
    if (!scoreTitle(title, source.titleKeywords) && !url.includes("product")) continue;
    if (/^(전체|로그인|회원가입|장바구니|검색|더보기)$/i.test(title)) continue;

    seen.add(url);
    items.push({
      key: productKey(source.gallerySlug, url),
      gallerySlug: source.gallerySlug,
      title,
      brand: source.brand,
      category: source.category,
      description: `${source.mallName}에서 수집한 공식몰 상품 후보입니다. 관리자 확인 후 등록해주세요.`,
      imageUrl: imageUrl || undefined,
      mallName: source.mallName,
      price: parsePrice(anchorHtml),
      shippingFee: 0,
      url,
      source: "official_shop",
      availabilityLabel: availabilityLabel(contextText)
    });
  }

  return items;
}

async function collectFromUrl(source: CollectSource, url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SemoduckAdminProductCollector/1.0",
      Accept: "text/html,application/xhtml+xml"
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return extractCandidates({ ...source, url }, html);
}

async function collectFromSource(source: CollectSource) {
  const items: OfficialProductCandidate[] = [];
  for (const url of source.urls ?? [source.url]) {
    items.push(...(await collectFromUrl(source, url)));
  }
  return uniqueByKeyOrUrl(items);
}

async function collectPokemonStoreProducts() {
  const envResponse = await fetch("https://www.pokemonstore.co.kr/environment.json", {
    next: { revalidate: 3600 }
  });
  if (!envResponse.ok) throw new Error(`pokemon env ${envResponse.status}`);

  const env = (await envResponse.json()) as { clientId?: string };
  if (!env.clientId) throw new Error("pokemon client id missing");

  const headers = {
    accept: "application/json",
    version: "1.0",
    clientid: env.clientId,
    platform: "PC"
  };

  const pages: Array<{ pageCount?: number; items?: PokemonStoreProduct[] }> = [];
  for (let pageNumber = 1; pageNumber <= 30; pageNumber += 1) {
    const url = new URL("https://shop-api.e-ncp.com/products/search");
    url.searchParams.set("pageNumber", String(pageNumber));
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("keyword", "포켓몬");

    const response = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`pokemon products ${response.status}`);

    const page = (await response.json()) as { pageCount?: number; items?: PokemonStoreProduct[] };
    pages.push(page);
    const pageCount = Math.min(Number(page.pageCount || 1), 30);
    if (pageNumber >= pageCount) break;
  }

  return pages
    .flatMap((page) => page.items ?? [])
    .filter((item) => !["STOP", "FINISHED", "ENDED"].includes(String(item.saleStatusType ?? "").toUpperCase()))
    .map((item): OfficialProductCandidate => {
      const productNo = item.productNo ?? String(item.searchProductId ?? "").split(":").pop() ?? "";
      const soldOut = Boolean(item.soldOut) || item.saleStatusType === "SOLDOUT" || item.mainStockCnt === 0;
      const image = item.listImageUrls?.[0] || item.imageUrls?.[0] || item.listImageUrlInfo?.url || item.imageUrlInfo?.[0]?.url;

      return {
        key: `pokemon-store-${productNo}`,
        gallerySlug: "pokemon",
        title: item.productName || `포켓몬 상품 ${productNo}`,
        brand: item.brandNameKo || "포켓몬",
        category: "게임굿즈",
        description: "Pokemon Store Korea에서 수집한 공식 상품입니다.",
        imageUrl: image ? (image.startsWith("//") ? `https:${image}` : image) : undefined,
        mallName: "Pokemon Store Korea",
        price: Number(item.salePrice || item.immediateDiscountAmt || item.minSalePrice || 0),
        shippingFee: 0,
        url: `https://www.pokemonstore.co.kr/pages/product/product-detail.html?productNo=${productNo}`,
        source: "official_shop",
        availabilityLabel: soldOut ? "품절" : item.reservationData ? "예약판매" : "판매중"
      };
    });
}

type PokemonStoreProduct = {
  productNo?: string | number;
  searchProductId?: string;
  productName?: string;
  brandNameKo?: string;
  saleStatusType?: string;
  soldOut?: boolean;
  mainStockCnt?: number;
  reservationData?: unknown;
  listImageUrls?: string[];
  imageUrls?: string[];
  listImageUrlInfo?: { url?: string };
  imageUrlInfo?: Array<{ url?: string }>;
  salePrice?: number;
  immediateDiscountAmt?: number;
  minSalePrice?: number;
};

const dotorisupHeaders = {
  accept: "application/json",
  version: "1.0",
  clientid: "lq+utCM77nQkP611GTjHTw==",
  platform: "PC",
  accessToken: ""
};

async function collectDotorisupProducts() {
  const pages: Array<{ pageCount?: number; items?: DotorisupProduct[] }> = [];

  for (let pageNumber = 1; pageNumber <= 200; pageNumber += 1) {
    const url = new URL("https://shop-api.e-ncp.com/products/search");
    url.searchParams.set("categoryNos", "435457");
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("pageNumber", String(pageNumber));
    url.searchParams.set("order.soldoutPlaceEnd", "true");
    url.searchParams.set("order.by", "RECENT_PRODUCT");
    url.searchParams.set("order.direction", "DESC");
    url.searchParams.set("filter.totalReviewCount", "true");
    url.searchParams.set("filter.soldout", "true");

    const response = await fetch(url, { headers: dotorisupHeaders, next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`dotorisup products ${response.status}`);

    const page = (await response.json()) as { pageCount?: number; items?: DotorisupProduct[] };
    pages.push(page);
    const pageCount = Math.min(Number(page.pageCount || 1), 200);
    if (pageNumber >= pageCount) break;
  }

  return pages
    .flatMap((page) => page.items ?? [])
    .filter((item) => item.frontDisplayYn !== false)
    .filter((item) => !["STOP", "FINISHED", "ENDED"].includes(String(item.saleStatusType ?? "").toUpperCase()))
    .filter((item) => !isPastSaleEnd(item.saleEndYmdt))
    .map((item): OfficialProductCandidate => {
      const image = item.listImageUrls?.[0] || item.imageUrls?.[0] || item.listImageUrlInfo?.url || item.imageUrlInfo?.[0]?.url;
      const soldOut = Boolean(item.isSoldOut) || item.saleStatusType === "SOLDOUT" || item.stockCnt === 0 || item.mainStockCnt === 0;
      const comingSoon = item.saleStatusType === "READY" || (!soldOut && item.saleStartYmdt ? new Date(`${item.saleStartYmdt.replace(" ", "T")}+09:00`).getTime() > Date.now() : false);

      return {
        key: `ghibli-dotorisup-${item.productNo}`,
        gallerySlug: "ghibli",
        title: item.productName || `지브리 상품 ${item.productNo}`,
        brand: item.brandNameKo || item.brandName || "스튜디오 지브리",
        category: "애니굿즈",
        description: "도토리숲 공식샵에서 수집한 스튜디오 지브리 공식 상품입니다.",
        imageUrl: image ? (image.startsWith("//") ? `https:${image}` : image) : undefined,
        mallName: "도토리숲",
        price: Number(item.salePrice || item.minSalePrice || 0),
        shippingFee: 2500,
        url: `https://www.dotorisup.com/product/detail/${item.productNo}`,
        source: "official_shop",
        availabilityLabel: soldOut ? "품절" : comingSoon ? "판매예정" : item.reservationData ? "예약판매" : "판매중"
      };
    });
}

type DotorisupProduct = {
  productNo?: string | number;
  productName?: string;
  brandName?: string;
  brandNameKo?: string;
  saleStatusType?: string;
  saleStartYmdt?: string;
  saleEndYmdt?: string;
  frontDisplayYn?: boolean;
  isSoldOut?: boolean;
  stockCnt?: number;
  mainStockCnt?: number;
  reservationData?: unknown;
  listImageUrls?: string[];
  imageUrls?: string[];
  listImageUrlInfo?: { url?: string };
  imageUrlInfo?: Array<{ url?: string }>;
  salePrice?: number;
  minSalePrice?: number;
};

function isPastSaleEnd(value?: string | null) {
  if (!value) return false;
  const endTime = new Date(`${value.replace(" ", "T")}+09:00`).getTime();
  return Number.isFinite(endTime) && endTime < Date.now();
}

async function collectFandingProducts() {
  const creatorNo = 3142;
  const items: OfficialProductCandidate[] = [];
  let lastProductNo = "";
  let totalCount = Infinity;

  while (items.length < totalCount) {
    const url = new URL("https://fanding.kr/rest/product/list");
    url.searchParams.set("iCreatorNo", String(creatorNo));
    url.searchParams.set("iLimit", "20");
    url.searchParams.set("sSortOrder", "recent");
    if (lastProductNo) url.searchParams.set("iLastProductNo", lastProductNo);

    const response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0" },
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error(`fanding ${response.status}`);

    const data = (await response.json()) as FandingProductResponse;
    const products = data.aData?.aProductList ?? [];
    totalCount = Number(data.aData?.iTotalCount ?? products.length);
    if (!products.length) break;

    for (const product of products) {
      if (isPastSaleEnd(product.sSaleEndDatetime)) continue;
      const title = product.aTitle?.ko || product.aTitle?.en || `스텔라이브 상품 ${product.iProductNo}`;
      const status = product.iStock === 0 || product.sSaleStatus === "sold_out" ? "품절" : product.sType === "pre_order" ? "예약판매" : "판매중";

      items.push({
        key: `stellive-fanding-${product.iProductNo}`,
        gallerySlug: "stellive",
        title,
        brand: "스텔라이브",
        category: "버튜버굿즈",
        description: "Fanding 스텔라이브 공식 숍에서 수집한 상품입니다.",
        imageUrl: product.sThumbnailUrl || undefined,
        mallName: "Fanding 스텔라이브",
        price: Number(product.iPrice || product.iRegularPrice || 0),
        shippingFee: 0,
        url: `https://fanding.kr/@stellive/shop/${product.iProductNo}`,
        source: "official_shop",
        availabilityLabel: status
      });
    }

    lastProductNo = products.at(-1)?.iProductNo ? String(products.at(-1)?.iProductNo) : "";
    if (!lastProductNo) break;
  }

  return items;
}

type FandingProductResponse = {
  aData?: {
    iTotalCount?: number;
    aProductList?: FandingProduct[];
  };
};

type FandingProduct = {
  iProductNo: number;
  aTitle?: { ko?: string; en?: string };
  sThumbnailUrl?: string;
  sType?: string;
  iPrice?: number;
  iRegularPrice?: number;
  sSaleStatus?: string;
  iStock?: number;
  sSaleEndDatetime?: string;
};

async function collectNaverOfficialMallProducts({ query, gallerySlug, brand, category, mallNames, limit = 200, itemFilter }: NaverCollectOptions) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("missing naver api keys");

  const items: OfficialProductCandidate[] = [];
  for (let start = 1; start <= limit; start += 100) {
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", "100");
    url.searchParams.set("start", String(start));
    url.searchParams.set("sort", "sim");

    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      },
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error(`naver ${response.status}`);

    const data = (await response.json()) as { items?: NaverShoppingItem[] };
    for (const item of data.items ?? []) {
      const mallName = item.mallName || "";
      if (!mallNames.some((name) => mallName.toLowerCase().includes(name.toLowerCase()))) continue;
      if (itemFilter && !itemFilter(item)) continue;

      items.push({
        key: `${gallerySlug}-naver-${item.productId || productKey(gallerySlug, item.link)}`,
        gallerySlug,
        title: stripHtml(item.title),
        brand: item.brand || item.maker || brand,
        category,
        description: `${mallName}에서 확인한 공식/브랜드스토어 상품입니다.`,
        imageUrl: item.image || undefined,
        mallName,
        price: Number(item.lprice || 0),
        shippingFee: 0,
        url: item.link,
        source: "naver_shopping",
        availabilityLabel: "공식 스토어"
      });
    }
  }

  return uniqueByKeyOrUrl(items);
}

type NaverShoppingItem = {
  title: string;
  link: string;
  image?: string;
  lprice?: string;
  mallName?: string;
  productId?: string;
  brand?: string;
  maker?: string;
};

function isSanrioOfficialStoreItem(item: NaverShoppingItem) {
  const mallName = item.mallName || "";
  const title = stripHtml(item.title || "");
  const text = `${title} ${item.brand || ""} ${item.maker || ""}`.toLowerCase();
  const hasSanrioKeyword = ["산리오", "sanrio", "헬로키티", "쿠로미", "시나모롤", "마이멜로디", "폼폼푸린", "포차코", "한교동"].some((keyword) =>
    text.includes(keyword.toLowerCase())
  );
  const hasOfficialMallName = /공식\s*스토어|공식스토어|공식몰|공식\s*몰/i.test(mallName);
  const hasOfficialTitle = /공식/i.test(title);
  return hasSanrioKeyword && (hasOfficialMallName || hasOfficialTitle);
}

async function collectSanrioOfficialProducts() {
  const queries = ["산리오 공식", "산리오 공식 스토어"];
  const items: OfficialProductCandidate[] = [];
  for (const query of queries) {
    items.push(
      ...(await collectNaverOfficialMallProducts({
        query,
        gallerySlug: "sanrio",
        brand: "산리오",
        category: "캐릭터굿즈",
        mallNames: ["공식스토어", "공식 스토어", "공식몰", "공식 몰", "네이버"],
        limit: 200,
        itemFilter: isSanrioOfficialStoreItem
      }))
    );
  }
  return uniqueByKeyOrUrl(items);
}

function addFallback(collected: OfficialProductCandidate[], gallerySlug: string) {
  const fallback = staticFallbacksByGallery.get(gallerySlug);
  if (fallback) collected.push(fallback);
}

export async function collectOfficialShopCandidates(): Promise<OfficialShopCollectResult> {
  const collected: OfficialProductCandidate[] = [];
  const skipped: OfficialShopCollectResult["skipped"] = [];

  try {
    const sanrio = await collectSanrioOfficialProducts();

    if (sanrio.length) {
      collected.push(...sanrio);
    } else {
      collected.push(sanrioCandidate);
      skipped.push({
        gallerySlug: "sanrio",
        mallName: "네이버 공식 브랜드스토어 검색",
        reason: "네이버 쇼핑 API에서 산리오 공식몰 상품을 찾지 못해 공식 브랜드스토어 검색 링크로 대체했습니다."
      });
    }
  } catch (error) {
    collected.push(sanrioCandidate);
    skipped.push({ gallerySlug: "sanrio", mallName: "네이버 공식 브랜드스토어 검색", reason: error instanceof Error ? error.message : "수집 실패" });
  }

  try {
    collected.push(...(await collectPokemonStoreProducts()));
  } catch (error) {
    addFallback(collected, "pokemon");
    skipped.push({ gallerySlug: "pokemon", mallName: "Pokemon Store Korea", reason: error instanceof Error ? error.message : "수집 실패" });
  }

  try {
    collected.push(...(await collectDotorisupProducts()));
  } catch (error) {
    addFallback(collected, "ghibli");
    skipped.push({ gallerySlug: "ghibli", mallName: "도토리숲", reason: error instanceof Error ? error.message : "수집 실패" });
  }

  try {
    collected.push(
      ...(await collectNaverOfficialMallProducts({
        query: "웹툰프렌즈 굿즈",
        gallerySlug: "webtoon-goods",
        brand: "네이버웹툰",
        category: "웹툰굿즈",
        mallNames: ["웹툰프렌즈", "WEBTOON FRIENDS"],
        limit: 200
      }))
    );
  } catch (error) {
    addFallback(collected, "webtoon-goods");
    skipped.push({ gallerySlug: "webtoon-goods", mallName: "WEBTOON FRIENDS", reason: error instanceof Error ? error.message : "수집 실패" });
  }

  try {
    const riotCategory: OfficialProductCandidate = {
      key: "lol-riot-store-official-category",
      gallerySlug: "lol",
      title: "Riot Store 네이버 공식 브랜드스토어 상품",
      brand: "League of Legends",
      category: "게임굿즈",
      description: "Riot Store 네이버 공식 브랜드스토어 카테고리에서 확인하는 리그 오브 레전드 공식 상품입니다.",
      mallName: "Riot Store",
      price: 0,
      shippingFee: 0,
      url: riotStoreCategoryUrl,
      source: "naver_shopping",
      availabilityLabel: "공식 브랜드스토어"
    };
    collected.push(
      riotCategory,
      ...(await collectNaverOfficialMallProducts({
        query: "라이엇 스토어",
        gallerySlug: "lol",
        brand: "League of Legends",
        category: "게임굿즈",
        mallNames: ["Riot Store", "라이엇 스토어", "라이엇스토어"],
        limit: 300
      }))
    );
  } catch (error) {
    addFallback(collected, "lol");
    skipped.push({ gallerySlug: "lol", mallName: "Riot Store", reason: error instanceof Error ? error.message : "수집 실패" });
  }

  try {
    collected.push(...(await collectFandingProducts()));
  } catch (error) {
    addFallback(collected, "stellive");
    skipped.push({ gallerySlug: "stellive", mallName: "Fanding 스텔라이브", reason: error instanceof Error ? error.message : "수집 실패" });
  }

  for (const source of htmlSources) {
    try {
      const items = await collectFromSource(source);
      if (items.length) {
        collected.push(...items);
        continue;
      }

      addFallback(collected, source.gallerySlug);
      skipped.push({ gallerySlug: source.gallerySlug, mallName: source.mallName, reason: "상품 목록을 읽지 못해 공식몰 대표 후보로 대체했습니다." });
    } catch (error) {
      addFallback(collected, source.gallerySlug);
      skipped.push({ gallerySlug: source.gallerySlug, mallName: source.mallName, reason: error instanceof Error ? error.message : "수집 실패" });
    }
  }

  return {
    items: uniqueByKeyOrUrl([...collected, ...officialProductCandidates]),
    skipped
  };
}
