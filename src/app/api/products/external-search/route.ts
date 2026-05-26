import { NextResponse } from "next/server";
import { searchNaverShopping, type NormalizedExternalOffer } from "@/lib/external/naver-shopping";
import { productFromDbRow, productSelect } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";

const synonymGroups = [
  ["롤", "리그오브레전드", "리그 오브 레전드", "League of Legends", "League of Legend", "LoL", "라이엇 스토어", "라이엇스토어"],
  ["이터널리턴", "이터널 리턴", "Eternal Return", "이리"],
  ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  ["포켓몬", "Pokemon", "피카츄"],
  ["원피스", "One Piece", "루피", "조로", "상디"],
  ["스텔라이브", "Stellive", "Fanding"],
  ["지브리", "스튜디오 지브리", "Studio Ghibli", "도토리숲", "토토로", "키키", "하울", "치히로"]
];

function stripGoodsWords(value: string) {
  return value.replace(/굿즈|상품|공식|키링|피규어|인형|스티커|포토카드/gi, " ").replace(/\s+/g, " ").trim();
}

function expandedQueries(query: string) {
  const trimmed = query.trim() || "쿠로미 키링";
  const compact = trimmed.toLowerCase().replace(/\s+/g, "");
  const matched = synonymGroups.find((group) => group.some((word) => compact.includes(word.toLowerCase().replace(/\s+/g, ""))));
  const baseWords = matched ? matched : [stripGoodsWords(trimmed) || trimmed];
  return [...new Set([trimmed, ...baseWords.map((word) => `${word} 굿즈`)])].slice(0, 4);
}

function dbSearchTerms(query: string) {
  const trimmed = query.trim() || "쿠로미 키링";
  const compact = trimmed.toLowerCase().replace(/\s+/g, "");
  const matched = synonymGroups.find((group) => group.some((word) => compact.includes(word.toLowerCase().replace(/\s+/g, ""))));
  return [...new Set([stripGoodsWords(trimmed), ...(matched ?? [])].filter(Boolean))];
}

function compactText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function termScore(text: string, term: string) {
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  if (lowerText.includes(lowerTerm)) return 2;
  if (compactText(lowerText).includes(compactText(lowerTerm))) return 1;
  return 0;
}

function normalizeProductName(value: string) {
  return value
    .replace(/\[[^\]]+\]|\([^)]+\)/g, " ")
    .replace(/라이엇\s*스토어|공식|정품|굿즈|예약판매|판매중/gi, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase();
}

function isPriceCompareLink(item: NormalizedExternalOffer) {
  return item.mallName === "네이버" || /search\.shopping\.naver\.com\/catalog/i.test(item.url);
}

function isPriceCompareOffer(offer: { mallName: string; url: string }) {
  return offer.mallName === "네이버" || /search\.shopping\.naver\.com\/catalog/i.test(offer.url);
}

async function getOfficialDbItems(query: string) {
  const supabase = createDataSupabaseClient();
  const terms = dbSearchTerms(query);
  if (!terms.length) return [];
  const filters = terms.flatMap((term) => [
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
    .limit(80);

  return (data ?? [])
    .map((row) => {
      const product = productFromDbRow(row);
      const text = `${product.title} ${product.normalizedTitle} ${product.brand} ${product.category} ${product.description} ${product.tags.join(" ")}`;
      const score = terms.reduce((sum, term) => sum + termScore(text, term), 0);
      return { product, score };
    })
    .filter(({ product, score }) => score > 0 && (product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial)))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product)
    .filter((product) => product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial))
    .map((product): NormalizedExternalOffer | null => {
      const offer = product.offers.find((item) => item.isOfficial && !isPriceCompareOffer(item)) ?? product.offers.find((item) => !isPriceCompareOffer(item));
      if (!offer) return null;
      return {
        id: product.id,
        title: product.title,
        image: product.image,
        brand: product.brand,
        category: product.category,
        source: offer.source,
        mallName: offer.mallName,
        price: offer.price,
        shippingFee: offer.shippingFee,
        condition: offer.condition,
        isOfficial: true,
        isUsed: false,
        url: offer.url
      };
    })
    .filter(Boolean) as NormalizedExternalOffer[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "쿠로미 키링";
  const requestedDisplay = Math.min(Math.max(Number(searchParams.get("display") ?? 120), 1), 120);
  const start = Math.min(Math.max(Number(searchParams.get("start") ?? 1), 1), 1000);
  const queries = expandedQueries(query);
  const externalBudget = Math.max(24, Math.floor(requestedDisplay / queries.length));

  const [officialItems, pages] = await Promise.all([
    getOfficialDbItems(query),
    Promise.all(
      queries.flatMap((expandedQuery) =>
        Array.from({ length: Math.ceil(externalBudget / 100) }, (_, index) => {
          const pageStart = start + index * 100;
          if (pageStart > 1000) return null;
          return searchNaverShopping(expandedQuery, Math.min(100, externalBudget - index * 100), pageStart);
        }).filter((request): request is ReturnType<typeof searchNaverShopping> => Boolean(request))
      )
    )
  ]);

  const first = pages[0];
  const seen = new Set<string>();
  const items = [...officialItems, ...pages.flatMap((page) => page.items).filter((item) => !isPriceCompareLink(item))]
    .sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial))
    .filter((item) => {
      const key = normalizeProductName(item.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, requestedDisplay);

  return NextResponse.json({
    query: first?.query ?? query,
    usedMock: pages.some((page) => page.usedMock),
    error: pages.find((page) => page.error)?.error ?? null,
    total: first?.total ?? items.length,
    items
  });
}
