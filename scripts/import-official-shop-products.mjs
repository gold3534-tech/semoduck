import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").trim();
}

const sanrioCandidate = {
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

const fallbackCandidates = [
  {
    key: "bts-weverse-md",
    gallerySlug: "bts",
    title: "BTS 공식 MD",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "Weverse Shop에서 확인하는 BTS 공식 MD입니다.",
    mallName: "Weverse Shop",
    price: 0,
    shippingFee: 0,
    url: "https://weverseshop.io/",
    source: "official_shop"
  },
  {
    key: "pokemon-store-korea-goods",
    gallerySlug: "pokemon",
    title: "포켓몬스토어 코리아 공식 굿즈",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "포켓몬스토어 코리아에서 확인하는 포켓몬 공식 굿즈입니다.",
    mallName: "Pokemon Store Korea",
    price: 0,
    shippingFee: 0,
    url: "https://www.pokemonstore.co.kr/",
    source: "official_shop"
  },
  {
    key: "onepiece-daewonshop-goods",
    gallerySlug: "onepiece",
    title: "원피스 대원샵 공식 굿즈",
    brand: "원피스",
    category: "애니굿즈",
    description: "대원샵에서 확인하는 원피스 공식 굿즈입니다.",
    mallName: "대원샵",
    price: 0,
    shippingFee: 0,
    url: "https://www.daewonshop.com/",
    source: "official_shop"
  },
  {
    key: "webtoon-friends-goods",
    gallerySlug: "webtoon-goods",
    title: "웹툰프렌즈 공식 굿즈",
    brand: "네이버웹툰",
    category: "웹툰굿즈",
    description: "WEBTOON FRIENDS에서 확인하는 네이버웹툰 공식 굿즈입니다.",
    mallName: "WEBTOON FRIENDS",
    price: 0,
    shippingFee: 0,
    url: "https://brand.naver.com/webtoonfriends",
    source: "official_shop"
  },
  {
    key: "riot-store-korea-goods",
    gallerySlug: "lol",
    title: "리그 오브 레전드 공식 상점",
    brand: "League of Legends",
    category: "게임굿즈",
    description: "LoL 공식 상점에서 확인하는 리그 오브 레전드 상품입니다.",
    mallName: "LoL 상점",
    price: 0,
    shippingFee: 0,
    url: "https://store.leagueoflegends.co.kr/",
    source: "official_shop"
  },
  {
    key: "eternal-return-estar-goods",
    gallerySlug: "eternal-return",
    title: "이터널 리턴 공식 굿즈",
    brand: "이터널 리턴",
    category: "게임굿즈",
    description: "ESTAR EGG에서 확인하는 이터널 리턴 공식굿즈입니다.",
    mallName: "ESTAR EGG",
    price: 0,
    shippingFee: 0,
    url: "https://estar-egg.com/product/list.html?cate_no=43",
    source: "official_shop"
  },
  {
    key: "stellive-fanding-goods",
    gallerySlug: "stellive",
    title: "스텔라이브 공식 굿즈",
    brand: "스텔라이브",
    category: "버튜버굿즈",
    description: "Fanding 스텔라이브 샵에서 확인하는 공식 굿즈입니다.",
    mallName: "Fanding 스텔라이브",
    price: 0,
    shippingFee: 0,
    url: "https://fanding.kr/@stellive/shop",
    source: "official_shop"
  }
];

const sources = [
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
    titleKeywords: ["이터널 리턴", "이터널리턴", "굿즈", "아크릴", "키링", "장패드"]
  }
];

const fallbackByGallery = new Map(fallbackCandidates.map((candidate) => [candidate.gallerySlug, candidate]));
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

const availabilityPatterns = [
  { label: "품절", pattern: /품절|sold\s*out|일시품절|out\s*of\s*stock|在庫なし/i },
  { label: "판매예정", pattern: /판매\s*예정|오픈\s*예정|출시\s*예정|coming\s*soon|販売予定|発売予定/i },
  { label: "예약판매", pattern: /예약\s*판매|예약\s*구매|pre-?order|사전\s*예약|予約販売|予約受付/i },
  { label: "판매중", pattern: /판매중|구매하기|장바구니|buy\s*now|販売中/i }
];

function toAbsoluteUrl(baseUrl, value) {
  if (!value || value.startsWith("data:")) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "));
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? "";
}

function parsePrice(value) {
  const match = value.replace(/,/g, "").match(/(\d{3,})\s*원/);
  return match ? Number(match[1]) : 0;
}

function isSaleEnded(value) {
  return saleEndedPatterns.some((pattern) => pattern.test(value));
}

function availabilityLabel(value) {
  return availabilityPatterns.find(({ pattern }) => pattern.test(value))?.label;
}

function scoreTitle(title, keywords) {
  const lowered = title.toLowerCase();
  return keywords.filter((keyword) => lowered.includes(keyword.toLowerCase())).length;
}

function extractCandidates(source, html) {
  const items = [];
  const seen = new Set();
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
      key: `${source.gallerySlug}-${Buffer.from(url).toString("base64url").slice(0, 18)}`,
      gallerySlug: source.gallerySlug,
      title,
      brand: source.brand,
      category: source.category,
      description: `${source.mallName}에서 수집한 공식몰 상품 후보입니다.`,
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

async function collectFromUrl(source, url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SemoduckAdminProductCollector/1.0",
      Accept: "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return extractCandidates({ ...source, url }, await response.text());
}

async function collectFromSource(source) {
  const items = [];
  for (const url of source.urls ?? [source.url]) {
    items.push(...(await collectFromUrl(source, url)));
  }
  return [...new Map(items.map((item) => [item.url, item])).values()];
}

async function collectPokemonStoreProducts() {
  const envResponse = await fetch("https://www.pokemonstore.co.kr/environment.json");
  if (!envResponse.ok) throw new Error(`pokemon env ${envResponse.status}`);
  const { clientId } = await envResponse.json();
  const headers = {
    accept: "application/json",
    version: "1.0",
    clientid: clientId,
    platform: "PC"
  };
  const firstUrl = new URL("https://shop-api.e-ncp.com/products/search");
  firstUrl.searchParams.set("pageNumber", "1");
  firstUrl.searchParams.set("pageSize", "100");
  firstUrl.searchParams.set("keyword", "포켓몬");
  const first = await fetch(firstUrl, { headers }).then((response) => response.json());
  const pageCount = Math.min(Number(first.pageCount || 1), 30);
  const pages = [first];
  for (let page = 2; page <= pageCount; page += 1) {
    const url = new URL("https://shop-api.e-ncp.com/products/search");
    url.searchParams.set("pageNumber", String(page));
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("keyword", "포켓몬");
    pages.push(await fetch(url, { headers }).then((response) => response.json()));
  }
  return pages
    .flatMap((page) => page.items ?? [])
    .filter((item) => !["STOP", "FINISHED", "ENDED"].includes(String(item.saleStatusType ?? "").toUpperCase()))
    .map((item) => {
      const productNo = item.productNo ?? String(item.searchProductId ?? "").split(":").pop();
      const soldOut = item.soldOut || item.saleStatusType === "SOLDOUT" || item.mainStockCnt === 0;
      const image = item.listImageUrls?.[0] || item.imageUrls?.[0] || item.listImageUrlInfo?.url || item.imageUrlInfo?.[0]?.url;
      return {
        key: `pokemon-store-${productNo}`,
        gallerySlug: "pokemon",
        title: item.productName,
        brand: item.brandNameKo || "포켓몬",
        category: "게임굿즈",
        description: "포켓몬스토어 코리아에서 수집한 공식 상품입니다.",
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

function isPastSaleEnd(value) {
  if (!value) return false;
  const endTime = new Date(value.replace(" ", "T") + "+09:00").getTime();
  return Number.isFinite(endTime) && endTime < Date.now();
}

async function collectFandingProducts() {
  const creatorNo = 3142;
  const items = [];
  let lastProductNo = "";
  let totalCount = Infinity;
  while (items.length < totalCount) {
    const url = new URL("https://fanding.kr/rest/product/list");
    url.searchParams.set("iCreatorNo", String(creatorNo));
    url.searchParams.set("iLimit", "20");
    url.searchParams.set("sSortOrder", "recent");
    if (lastProductNo) url.searchParams.set("iLastProductNo", lastProductNo);
    const data = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } }).then((response) => response.json());
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
        description: "Fanding 스텔라이브 공식 샵에서 수집한 상품입니다.",
        imageUrl: product.sThumbnailUrl || undefined,
        mallName: "Fanding 스텔라이브",
        price: Number(product.iPrice || product.iRegularPrice || 0),
        shippingFee: 0,
        url: `https://fanding.kr/@stellive/shop/${product.iProductNo}`,
        source: "official_shop",
        availabilityLabel: status
      });
    }
    lastProductNo = products.at(-1)?.iProductNo ? String(products.at(-1).iProductNo) : "";
    if (!lastProductNo) break;
  }
  return items;
}

async function collectNaverOfficialMallProducts({ query, gallerySlug, brand, category, mallNames, limit = 200, itemFilter }) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("missing naver api keys");
  const items = [];
  for (let start = 1; start <= limit; start += 100) {
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", "100");
    url.searchParams.set("start", String(start));
    url.searchParams.set("sort", "sim");
    const data = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      }
    }).then((response) => response.json());
    for (const item of data.items ?? []) {
      const mallName = item.mallName || "";
      if (!mallNames.some((name) => mallName.toLowerCase().includes(name.toLowerCase()))) continue;
      if (itemFilter && !itemFilter(item)) continue;
      items.push({
        key: `${gallerySlug}-naver-${item.productId || Buffer.from(item.link).toString("base64url").slice(0, 18)}`,
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
  return items;
}

function isSanrioOfficialStoreItem(item) {
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
  const items = [];
  for (const query of ["산리오 공식", "산리오 공식 스토어"]) {
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
  return [...new Map(items.map((item) => [item.key, item])).values()];
}

async function collectCandidates() {
  const collected = [];
  const logs = [];

  try {
    const sanrio = await collectSanrioOfficialProducts();
    if (sanrio.length) {
      collected.push(...sanrio);
      logs.push({ gallerySlug: "sanrio", mallName: "산리오코리아", result: `naver:${sanrio.length}` });
    } else {
      collected.push(sanrioCandidate);
      logs.push({ gallerySlug: "sanrio", mallName: sanrioCandidate.mallName, result: "fallback:no-official-api-items" });
    }
  } catch (error) {
    collected.push(sanrioCandidate);
    logs.push({ gallerySlug: "sanrio", mallName: sanrioCandidate.mallName, result: `fallback:${error instanceof Error ? error.message : "unknown"}` });
  }

  try {
    const pokemon = await collectPokemonStoreProducts();
    collected.push(...pokemon);
    logs.push({ gallerySlug: "pokemon", mallName: "Pokemon Store Korea", result: `shopby:${pokemon.length}` });
  } catch (error) {
    const fallback = fallbackByGallery.get("pokemon");
    if (fallback) collected.push(fallback);
    logs.push({ gallerySlug: "pokemon", mallName: "Pokemon Store Korea", result: `fallback:${error instanceof Error ? error.message : "unknown"}` });
  }

  try {
    const webtoon = await collectNaverOfficialMallProducts({
      query: "웹툰프렌즈 굿즈",
      gallerySlug: "webtoon-goods",
      brand: "네이버웹툰",
      category: "웹툰굿즈",
      mallNames: ["웹툰프렌즈", "WEBTOON FRIENDS"],
      limit: 200
    });
    collected.push(...webtoon);
    logs.push({ gallerySlug: "webtoon-goods", mallName: "웹툰프렌즈", result: `naver:${webtoon.length}` });
  } catch (error) {
    const fallback = fallbackByGallery.get("webtoon-goods");
    if (fallback) collected.push(fallback);
    logs.push({ gallerySlug: "webtoon-goods", mallName: "웹툰프렌즈", result: `fallback:${error instanceof Error ? error.message : "unknown"}` });
  }

  try {
    const riot = await collectNaverOfficialMallProducts({
      query: "라이엇 스토어",
      gallerySlug: "lol",
      brand: "League of Legends",
      category: "게임굿즈",
      mallNames: ["Riot Store", "라이엇 스토어", "라이엇스토어"],
      limit: 300
    });
    const officialCategory = {
      key: "lol-riot-store-official-category",
      gallerySlug: "lol",
      title: "Riot Store 네이버 공식 브랜드스토어 상품",
      brand: "League of Legends",
      category: "게임굿즈",
      description: "네이버 Riot Store 공식 브랜드스토어 카테고리에서 확인하는 리그 오브 레전드 공식 상품입니다.",
      mallName: "Riot Store",
      price: 0,
      shippingFee: 0,
      url: "https://brand.naver.com/riot-store/category/f65ad626f5db4ea187f5a804dd2ce156?st=POPULAR&dt=BIG_IMAGE&page=1&size=40",
      source: "naver_shopping",
      availabilityLabel: "공식 브랜드스토어"
    };
    collected.push(officialCategory, ...riot);
    logs.push({ gallerySlug: "lol", mallName: "Riot Store", result: `naver:${riot.length}+category` });
  } catch (error) {
    const fallback = fallbackByGallery.get("lol");
    if (fallback) collected.push(fallback);
    logs.push({ gallerySlug: "lol", mallName: "Riot Store", result: `fallback:${error instanceof Error ? error.message : "unknown"}` });
  }

  try {
    const stellive = await collectFandingProducts();
    collected.push(...stellive);
    logs.push({ gallerySlug: "stellive", mallName: "Fanding 스텔라이브", result: `fanding:${stellive.length}` });
  } catch (error) {
    const fallback = fallbackByGallery.get("stellive");
    if (fallback) collected.push(fallback);
    logs.push({ gallerySlug: "stellive", mallName: "Fanding 스텔라이브", result: `fallback:${error instanceof Error ? error.message : "unknown"}` });
  }

  for (const source of sources) {
    try {
      const items = await collectFromSource(source);
      if (items.length) {
        collected.push(...items);
        logs.push({ gallerySlug: source.gallerySlug, mallName: source.mallName, result: `collected:${items.length}` });
        continue;
      }
      const fallback = fallbackByGallery.get(source.gallerySlug);
      if (fallback) collected.push(fallback);
      logs.push({ gallerySlug: source.gallerySlug, mallName: source.mallName, result: "fallback:no-items" });
    } catch (error) {
      const fallback = fallbackByGallery.get(source.gallerySlug);
      if (fallback) collected.push(fallback);
      logs.push({ gallerySlug: source.gallerySlug, mallName: source.mallName, result: `fallback:${error instanceof Error ? error.message : "unknown"}` });
    }
  }

  const deduped = new Map();
  for (const item of collected) deduped.set(`${item.title}:${item.url}`, item);
  return { items: [...deduped.values()], logs };
}

async function importCandidate(candidate) {
  const normalizedTitle = candidate.title.toLowerCase();
  const existing = await supabase.from("products").select("id").eq("normalized_title", normalizedTitle).maybeSingle();
  if (existing.error) throw existing.error;

  let productId = existing.data?.id;
  if (!productId) {
    const inserted = await supabase
      .from("products")
      .insert({
        title: candidate.title,
        normalized_title: normalizedTitle,
        brand: candidate.brand,
        category: candidate.category,
        description: candidate.description,
        image_url: candidate.imageUrl ?? null,
        is_official_product: true
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    productId = inserted.data.id;
  }

  const existingOffer = await supabase.from("product_offers").select("id").eq("product_id", productId).eq("url", candidate.url).maybeSingle();
  if (existingOffer.error) throw existingOffer.error;
  if (existingOffer.data?.id) {
    const updated = await supabase
      .from("product_offers")
      .update({
        source: candidate.source,
        mall_name: candidate.mallName,
        price: candidate.price,
        shipping_fee: candidate.shippingFee,
        is_official: true,
        special_benefit: candidate.availabilityLabel ?? null,
        last_checked_at: new Date().toISOString()
      })
      .eq("id", existingOffer.data.id);
    if (updated.error) throw updated.error;
    return "updated";
  }

  const offer = await supabase.from("product_offers").insert({
    product_id: productId,
    source: candidate.source,
    mall_name: candidate.mallName,
    price: candidate.price,
    shipping_fee: candidate.shippingFee,
    condition: "new",
    is_official: true,
    is_used: false,
    special_benefit: candidate.availabilityLabel ?? null,
    url: candidate.url,
    last_checked_at: new Date().toISOString()
  });
  if (offer.error) throw offer.error;
  return "inserted";
}

const { items, logs } = await collectCandidates();
let inserted = 0;
let updated = 0;

for (const item of items) {
  const result = await importCandidate(item);
  if (result === "inserted") inserted += 1;
  if (result === "updated") updated += 1;
}

console.log(JSON.stringify({ collected: items.length, inserted, updated, logs }, null, 2));
