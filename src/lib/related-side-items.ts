import { searchNaverShopping } from "@/lib/external/naver-shopping";
import {
  productFromDbRow,
  productSelect,
} from "@/lib/product-recommendations";
import type { Product } from "@/types/domain";

type SupabaseClient = any;

type GalleryInput = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
};

type PostInput = {
  id: string;
  title: string;
  content: string;
};

type MarketPreview = {
  id: string;
  title: string;
  description?: string | null;
  trade_type: string;
  price: number;
  image_url: string | null;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

export type RelatedSideItem =
  | {
      kind: "market";
      id: string;
      title: string;
      image: string | null;
      price: number;
      label: "유저거래";
      href: string;
      reason?: string;
    }
  | {
      kind: "product";
      id: string;
      title: string;
      image: string | null;
      price: number;
      label: "공식몰";
      href: string;
      reason?: string;
    }
  | {
      kind: "naver";
      id: string;
      title: string;
      image: string | null;
      price: number;
      label: "쇼핑검색";
      href: string;
      mallName: string;
      reason?: string;
    };

type CandidateItem =
  | {
      kind: "market";
      id: string;
      title: string;
      description?: string | null;
      galleryName?: string | null;
      gallerySlug?: string | null;
      tradeType: string;
      price: number;
      image: string | null;
      href: string;
    }
  | {
      kind: "product";
      id: string;
      title: string;
      brand?: string | null;
      category?: string | null;
      description?: string | null;
      tags: string[];
      gallerySlugs: string[];
      price: number;
      image: string | null;
      href: string;
    }
  | {
      kind: "naver";
      id: string;
      title: string;
      brand?: string | null;
      category?: string | null;
      mallName: string;
      price: number;
      image: string | null;
      href: string;
    };

const galleryBaseKeywords: Record<string, string> = {
  lol: "롤",
  "eternal-return": "이터널리턴",
  sanrio: "산리오",
  pokemon: "포켓몬",
  onepiece: "원피스",
  stellive: "스텔라이브",
  "webtoon-goods": "웹툰",
  bts: "BTS",
  ghibli: "지브리",
};

const galleryRequiredTerms: Record<string, string[]> = {
  lol: ["롤", "리그오브레전드", "리그 오브 레전드", "leagueoflegends", "라이엇", "riot"],
  "eternal-return": ["이터널리턴", "이터널 리턴", "eternalreturn", "이리"],
  sanrio: ["산리오", "sanrio", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  pokemon: ["포켓몬", "pokemon", "포켓몬스터", "피카츄", "꼬부기", "파이리", "이상해씨"],
  onepiece: ["원피스", "onepiece", "루피", "조로", "상디"],
  stellive: ["스텔라이브", "stellive", "fanding"],
  "webtoon-goods": ["웹툰", "webtoon", "웹툰프렌즈"],
  bts: ["bts", "방탄소년단", "방탄", "weverse"],
  ghibli: ["지브리", "ghibli", "스튜디오지브리", "토토로", "키키", "하울"],
};

const broadGallerySlugs = new Set(["webtoon-goods"]);

const goodsIntentWords = [
  "포토카드",
  "포카",
  "카드 바인더",
  "포카 바인더",
  "바인더",
  "카드파일",
  "카드 파일",
  "카드앨범",
  "카드 앨범",
  "키링",
  "인형",
  "피규어",
  "앨범",
  "아크릴스탠드",
  "아크릴 스탠드",
  "아크릴",
  "스탠드",
  "파우치",
  "케이스",
  "스티커",
  "마우스패드",
  "후드",
  "티셔츠",
  "유니폼",
  "오르골",
  "뱃지",
  "배지",
  "컵",
  "텀블러",
  "굿즈",
  "카드",
];

const genericIntentWords = new Set(["굿즈", "카드"]);

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function getProductPrice(product: Product) {
  const prices = product.offers
    .map((offer) => offer.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function extractIntentKeywords(text: string) {
  const normalized = normalizeText(text);

  const found = goodsIntentWords.filter((word) =>
    normalized.includes(normalizeText(word))
  );

  const hasSpecificCardIntent = found.some((word) =>
    ["포토카드", "포카", "카드 바인더", "포카 바인더", "바인더", "카드파일", "카드 파일", "카드앨범", "카드 앨범"].includes(word)
  );

  if (hasSpecificCardIntent) {
    return found.filter((word) => word !== "카드");
  }

  return found;
}

function termsForGallery(gallery: GalleryInput) {
  const fromMap = galleryRequiredTerms[gallery.slug] ?? [];
  return unique([
    ...(fromMap.length ? fromMap : []),
    galleryBaseKeywords[gallery.slug] ?? "",
    gallery.name ?? "",
    gallery.slug ?? "",
  ]).filter(Boolean);
}

function containsAnyTerm(text: string, terms: string[]) {
  const normalizedText = normalizeText(text);

  return terms.some((term) => {
    const normalizedTerm = normalizeText(term);
    return normalizedTerm && normalizedText.includes(normalizedTerm);
  });
}

function candidateSearchText(candidate: CandidateItem) {
  if (candidate.kind === "market") {
    return [
      candidate.title,
      candidate.description,
      candidate.galleryName,
      candidate.gallerySlug,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (candidate.kind === "product") {
    return [
      candidate.title,
      candidate.brand,
      candidate.category,
      candidate.description,
      candidate.tags.join(" "),
      candidate.gallerySlugs.join(" "),
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    candidate.title,
    candidate.brand,
    candidate.category,
    candidate.mallName,
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesGallery(candidate: CandidateItem, gallery: GalleryInput) {
  const requiredTerms = termsForGallery(gallery);

  if (!requiredTerms.length) {
    return true;
  }

  if (broadGallerySlugs.has(gallery.slug)) {
    return true;
  }

  if (candidate.kind === "market") {
    if (candidate.gallerySlug === gallery.slug) return true;
    if (candidate.galleryName === gallery.name) return true;
  }

  if (candidate.kind === "product") {
    if (candidate.gallerySlugs.includes(gallery.slug)) return true;
  }

  return containsAnyTerm(candidateSearchText(candidate), requiredTerms);
}

function buildSearchContext({
  post,
  gallery,
  tags,
}: {
  post: PostInput;
  gallery: GalleryInput;
  tags: string[];
}) {
  const baseKeyword =
    galleryBaseKeywords[gallery.slug] ?? gallery.name ?? gallery.slug;

  const sourceText = `${post.title} ${post.content} ${tags.join(" ")}`;
  const intentWords = extractIntentKeywords(sourceText);

  const specificIntentWords = intentWords.filter(
    (word) => !genericIntentWords.has(word)
  );

  const searchQuery =
    specificIntentWords.length > 0
      ? `${baseKeyword} ${specificIntentWords.slice(0, 2).join(" ")}`
      : `${baseKeyword} 굿즈`;

  const keywords = unique([
    baseKeyword,
    ...termsForGallery(gallery),
    ...intentWords,
    ...tags,
    post.title,
    gallery.name,
    gallery.slug,
  ])
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    baseKeyword,
    intentWords,
    searchQuery,
    keywords,
  };
}

function buildIlikeFilters(fields: string[], keywords: string[]) {
  return keywords
    .slice(0, 8)
    .flatMap((keyword) =>
      fields.map((field) => `${field}.ilike.%${keyword}%`)
    );
}

async function askOllamaForRelatedItems({
  post,
  gallery,
  tags,
  searchQuery,
  candidates,
}: {
  post: PostInput;
  gallery: GalleryInput;
  tags: string[];
  searchQuery: string;
  candidates: CandidateItem[];
}) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

  if (!baseUrl) {
    throw new Error("OLLAMA_BASE_URL is not configured.");
  }

  const compactCandidates = candidates.map((item) => {
    if (item.kind === "market") {
      return {
        kind: item.kind,
        id: item.id,
        title: item.title,
        description: item.description,
        galleryName: item.galleryName,
        gallerySlug: item.gallerySlug,
        tradeType: item.tradeType,
        price: item.price,
      };
    }

    if (item.kind === "product") {
      return {
        kind: item.kind,
        id: item.id,
        title: item.title,
        brand: item.brand,
        category: item.category,
        description: item.description,
        tags: item.tags,
        gallerySlugs: item.gallerySlugs,
        price: item.price,
      };
    }

    return {
      kind: item.kind,
      id: item.id,
      title: item.title,
      brand: item.brand,
      category: item.category,
      mallName: item.mallName,
      price: item.price,
    };
  });

  const prompt = `
너는 팬덤 굿즈 커뮤니티의 관련 추천 필터 AI다.

게시글 정보:
- 갤러리: ${gallery.name}
- 갤러리 slug: ${gallery.slug}
- 제목: ${post.title}
- 내용: ${post.content}
- 태그: ${tags.length ? tags.join(", ") : "없음"}
- 네이버 검색어: ${searchQuery}

후보 목록 JSON:
${JSON.stringify(compactCandidates, null, 2)}

선택 규칙:
1. 게시글과 실제로 관련 있는 후보만 고른다.
2. 관련성이 낮으면 억지로 채우지 않는다.
3. 유저거래(kind="market")는 최대 3개까지 고른다.
4. 내부 DB 굿즈(kind="product")는 최대 3개까지 고른다.
5. 네이버쇼핑(kind="naver")은 최대 3개까지 고른다.
6. 가장 중요한 규칙: 후보는 반드시 갤러리 팬덤과 관련 있어야 한다.
7. 포켓몬 갤러리라면 포켓몬, Pokemon, 피카츄 등과 관련 없는 후보는 제외한다.
8. 산리오 갤러리라면 산리오, 쿠로미, 시나모롤 등과 관련 없는 후보는 제외한다.
9. "카드"라는 단어만 같다고 카드지갑, 교통카드지갑, 동전지갑을 고르면 안 된다.
10. "포켓몬 카드 바인더"라면 포켓몬 카드/포켓몬 바인더 관련 후보만 고른다.
11. 출력은 반드시 JSON만 한다. 설명 문장 금지.

출력 형식:
{
  "selected": [
    {
      "kind": "market" | "product" | "naver",
      "id": "후보 id",
      "reason": "짧은 선택 이유"
    }
  ]
}
`;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const json = (await response.json()) as { response?: string };
  const text = json.response ?? "";

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Ollama response is not JSON.");
  }

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
    selected?: Array<{
      kind?: string;
      id?: string;
      reason?: string;
    }>;
  };

  return parsed.selected ?? [];
}

function fallbackRuleFilter({
  candidates,
  keywords,
  gallery,
}: {
  candidates: CandidateItem[];
  keywords: string[];
  gallery: GalleryInput;
}) {
  function score(candidate: CandidateItem) {
    if (!matchesGallery(candidate, gallery)) {
      return 0;
    }

    const text = candidateSearchText(candidate);
    const normalizedText = normalizeText(text);

    return keywords.reduce((sum, keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword) return sum;

      return sum + (normalizedText.includes(normalizedKeyword) ? 1 : 0);
    }, 0);
  }

  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: score(candidate),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const byKind = {
    market: [] as CandidateItem[],
    product: [] as CandidateItem[],
    naver: [] as CandidateItem[],
  };

  for (const item of scored) {
    byKind[item.candidate.kind].push(item.candidate);
  }

  return [
    ...byKind.market.slice(0, 3),
    ...byKind.product.slice(0, 3),
    ...byKind.naver.slice(0, 3),
  ].map((item) => ({
    kind: item.kind,
    id: item.id,
    reason: "갤러리와 키워드 기준으로 관련성이 있어 선택됨",
  }));
}

export async function getRelatedSideItems({
  supabase,
  post,
  gallery,
  tags = [],
}: {
  supabase: SupabaseClient;
  post: PostInput;
  gallery: GalleryInput;
  tags?: string[];
}): Promise<RelatedSideItem[]> {
  const { keywords, searchQuery } = buildSearchContext({
    post,
    gallery,
    tags,
  });

  const marketFilters = buildIlikeFilters(["title", "description"], keywords);

  const productFilters = buildIlikeFilters(
    ["title", "normalized_title", "brand", "category", "description"],
    keywords
  );

  const [marketResult, productResult, naverResult] = await Promise.all([
    marketFilters.length
      ? supabase
          .from("market_items")
          .select(
            "id,title,description,trade_type,price,image_url,galleries(name,slug)"
          )
          .in("status", ["active", "reserved"])
          .or(marketFilters.join(","))
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] },

    productFilters.length
      ? supabase
          .from("products")
          .select(productSelect)
          .or(productFilters.join(","))
          .order("is_official_product", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(30)
      : { data: [] },

    searchNaverShopping(searchQuery, 12),
  ]);

  const marketCandidates: CandidateItem[] = (
    (marketResult.data ?? []) as MarketPreview[]
  )
    .map((market) => {
      const galleryRow = Array.isArray(market.galleries)
        ? market.galleries[0]
        : market.galleries;

      return {
        kind: "market" as const,
        id: market.id,
        title: market.title,
        description: market.description,
        galleryName: galleryRow?.name,
        gallerySlug: galleryRow?.slug,
        tradeType: market.trade_type,
        price: market.price ?? 0,
        image: market.image_url,
        href: `/market/${market.id}`,
      };
    })
    .filter((candidate) => matchesGallery(candidate, gallery));

  const productCandidates: CandidateItem[] = ((productResult.data ?? []) as any[])
    .map((row): Product => productFromDbRow(row))
    .filter((product: Product) => {
      return (
        !product.id.startsWith("fallback-") &&
        !product.id.startsWith("naver-") &&
        Boolean(product.image) &&
        product.image !== "/placeholder-goods.svg"
      );
    })
    .map((product: Product) => ({
      kind: "product" as const,
      id: product.id,
      title: product.title,
      brand: product.brand,
      category: product.category,
      description: product.description,
      tags: product.tags,
      gallerySlugs: product.gallerySlugs,
      price: getProductPrice(product),
      image: product.image,
      href: `/goods/${product.id}`,
    }))
    .filter((candidate) => matchesGallery(candidate, gallery));

  const naverCandidates: CandidateItem[] = (naverResult.items ?? [])
    .filter((item) => Boolean(item.url))
    .map((item) => ({
      kind: "naver" as const,
      id: `naver-${item.id}`,
      title: item.title,
      brand: item.brand,
      category: item.category,
      mallName: item.mallName,
      price: item.price ?? 0,
      image: item.image ?? null,
      href: item.url,
    }))
    .filter((candidate) => matchesGallery(candidate, gallery));

  const candidates = [
    ...marketCandidates,
    ...productCandidates,
    ...naverCandidates,
  ];

  if (!candidates.length) {
    return [];
  }

  let selected: Array<{ kind?: string; id?: string; reason?: string }> = [];

  const shouldUseOllama =
    process.env.USE_OLLAMA_RECOMMENDER === "true" &&
    Boolean(process.env.OLLAMA_BASE_URL);

  if (shouldUseOllama) {
    try {
      selected = await askOllamaForRelatedItems({
        post,
        gallery,
        tags,
        searchQuery,
        candidates,
      });
    } catch (error) {
      console.error("related items ollama failed:", error);

      selected = fallbackRuleFilter({
        candidates,
        keywords,
        gallery,
      });
    }
  } else {
    selected = fallbackRuleFilter({
      candidates,
      keywords,
      gallery,
    });
  }

  const selectedKeys = new Set<string>();

  const selectedCountByKind = {
    market: 0,
    product: 0,
    naver: 0,
  };

  const result: RelatedSideItem[] = [];

  for (const selectedItem of selected) {
    const kind = selectedItem.kind;
    const id = selectedItem.id;

    if (kind !== "market" && kind !== "product" && kind !== "naver") continue;
    if (!id) continue;
    if (selectedCountByKind[kind] >= 3) continue;

    const key = `${kind}-${id}`;
    if (selectedKeys.has(key)) continue;

    const candidate = candidates.find(
      (item) => item.kind === kind && item.id === id
    );

    if (!candidate) continue;

    selectedKeys.add(key);
    selectedCountByKind[kind] += 1;

    if (candidate.kind === "market") {
      result.push({
        kind: "market",
        id: candidate.id,
        title: candidate.title,
        image: candidate.image,
        price: candidate.price,
        label: "유저거래",
        href: candidate.href,
        reason: selectedItem.reason,
      });
    }

    if (candidate.kind === "product") {
      result.push({
        kind: "product",
        id: candidate.id,
        title: candidate.title,
        image: candidate.image,
        price: candidate.price,
        label: "공식몰",
        href: candidate.href,
        reason: selectedItem.reason,
      });
    }

    if (candidate.kind === "naver") {
      result.push({
        kind: "naver",
        id: candidate.id,
        title: candidate.title,
        image: candidate.image,
        price: candidate.price,
        label: "쇼핑검색",
        href: candidate.href,
        mallName: candidate.mallName,
        reason: selectedItem.reason,
      });
    }
  }

  return result.slice(0, 9);
}