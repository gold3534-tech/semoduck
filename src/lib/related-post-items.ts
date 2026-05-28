import type { PostType } from "@/types/domain";

type SupabaseClient = any;

type GoodsSourceInput = {
  id: string;
  title: string;
  description?: string | null;
  brand?: string | null;
  category?: string | null;
  tags?: string[];
  gallerySlugs?: string[];
  galleryName?: string | null;
};

type GalleryRow = {
  id: string;
  name: string;
  slug: string;
};

type PostRow = {
  id: string;
  title: string;
  content: string;
  post_type: PostType;
  like_count: number | null;
  comment_count: number | null;
  bookmark_count: number | null;
  created_at: string;
  gallery_id?: string | null;
  galleries?: { name?: string | null; slug?: string | null } | Array<{ name?: string | null; slug?: string | null }> | null;
  profiles?: { nickname?: string | null; email?: string | null } | Array<{ nickname?: string | null; email?: string | null }> | null;
};

type PostTagRow = {
  post_id: string;
  tags?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

type CandidatePost = {
  id: string;
  title: string;
  content: string;
  postType: PostType;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  galleryName: string;
  gallerySlug: string;
  author: string;
  tags: string[];
  score: number;
};

export type RelatedPostItem = {
  id: string;
  title: string;
  content: string;
  postType: PostType;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  galleryName: string;
  gallerySlug: string;
  author: string;
  tags: string[];
  reason?: string;
};

const galleryBaseKeywords: Record<string, string[]> = {
  lol: ["롤", "리그오브레전드", "리그 오브 레전드", "league of legends", "라이엇", "riot"],
  "eternal-return": ["이터널리턴", "이터널 리턴", "eternal return", "이리"],
  sanrio: ["산리오", "sanrio", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  pokemon: ["포켓몬", "pokemon", "포켓몬스터", "피카츄", "꼬부기", "파이리", "이상해씨"],
  onepiece: ["원피스", "one piece", "루피", "조로", "상디"],
  stellive: ["스텔라이브", "stellive", "fanding"],
  "webtoon-goods": ["웹툰", "webtoon", "웹툰프렌즈"],
  bts: ["bts", "방탄소년단", "방탄", "weverse"],
  ghibli: ["지브리", "ghibli", "스튜디오 지브리", "토토로", "키키", "하울"],
};

const characterToGallerySlug: Record<string, string> = {
  // LoL
  아리: "lol",
  요네: "lol",
  야스오: "lol",
  티모: "lol",
  징크스: "lol",
  바이: "lol",
  케이틀린: "lol",
  럭스: "lol",
  세라핀: "lol",
  아케인: "lol",

  // Eternal Return
  아야: "eternal-return",
  현우: "eternal-return",
  재키: "eternal-return",
  매그너스: "eternal-return",
  쇼이치: "eternal-return",
  나딘: "eternal-return",
  루크: "eternal-return",
  피오라: "eternal-return",

  // Sanrio
  쿠로미: "sanrio",
  시나모롤: "sanrio",
  헬로키티: "sanrio",
  마이멜로디: "sanrio",
  폼폼푸린: "sanrio",
  포차코: "sanrio",

  // Pokemon
  피카츄: "pokemon",
  이브이: "pokemon",
  꼬부기: "pokemon",
  파이리: "pokemon",
  이상해씨: "pokemon",
  리자몽: "pokemon",
  잠만보: "pokemon",

  // One Piece
  루피: "onepiece",
  조로: "onepiece",
  상디: "onepiece",
  나미: "onepiece",
  쵸파: "onepiece",

  // Ghibli
  토토로: "ghibli",
  하울: "ghibli",
  키키: "ghibli",
  가오나시: "ghibli",
};

const goodsIntentWords = [
  "장패드",
  "마우스패드",
  "피규어",
  "키링",
  "인형",
  "포토카드",
  "포카",
  "카드 바인더",
  "포카 바인더",
  "바인더",
  "카드파일",
  "카드 파일",
  "카드앨범",
  "카드 앨범",
  "앨범",
  "아크릴스탠드",
  "아크릴 스탠드",
  "아크릴",
  "스탠드",
  "파우치",
  "케이스",
  "스티커",
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

function normalizeOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function extractIntentKeywords(text: string) {
  const normalized = normalizeText(text);

  const found = goodsIntentWords.filter((word) =>
    normalized.includes(normalizeText(word))
  );

  const hasSpecificCardIntent = found.some((word) =>
    [
      "포토카드",
      "포카",
      "카드 바인더",
      "포카 바인더",
      "바인더",
      "카드파일",
      "카드 파일",
      "카드앨범",
      "카드 앨범",
    ].includes(word)
  );

  if (hasSpecificCardIntent) {
    return found.filter((word) => word !== "카드");
  }

  return found;
}

function inferGallerySlugsFromText(text: string) {
  const normalized = normalizeText(text);
  const slugs = new Set<string>();

  for (const [slug, terms] of Object.entries(galleryBaseKeywords)) {
    if (terms.some((term) => normalized.includes(normalizeText(term)))) {
      slugs.add(slug);
    }
  }

  for (const [character, slug] of Object.entries(characterToGallerySlug)) {
    if (normalized.includes(normalizeText(character))) {
      slugs.add(slug);
    }
  }

  return [...slugs];
}

function termsForGallerySlugs(slugs: string[]) {
  return unique(slugs.flatMap((slug) => galleryBaseKeywords[slug] ?? [slug]));
}

function buildSearchContext(source: GoodsSourceInput) {
  const sourceText = [
    source.title,
    source.description,
    source.brand,
    source.category,
    source.galleryName,
    ...(source.tags ?? []),
    ...(source.gallerySlugs ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const inferredGallerySlugs = unique([
    ...(source.gallerySlugs ?? []),
    ...inferGallerySlugsFromText(sourceText),
  ]);

  const galleryTerms = termsForGallerySlugs(inferredGallerySlugs);
  const intentWords = extractIntentKeywords(sourceText);
  const specificIntentWords = intentWords.filter((word) => !genericIntentWords.has(word));

  const keywords = unique([
    ...galleryTerms,
    ...intentWords,
    ...(source.tags ?? []),
    source.title,
    source.brand ?? "",
    source.category ?? "",
  ])
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    sourceText,
    inferredGallerySlugs,
    galleryTerms,
    intentWords,
    specificIntentWords,
    keywords,
  };
}

function buildIlikeFilters(fields: string[], keywords: string[]) {
  return keywords
    .slice(0, 8)
    .flatMap((keyword) => fields.map((field) => `${field}.ilike.%${keyword}%`));
}

function postSearchText(post: CandidatePost) {
  return [
    post.title,
    post.content,
    post.galleryName,
    post.gallerySlug,
    post.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

function scorePost({
  post,
  keywords,
  gallerySlugs,
  intentWords,
}: {
  post: CandidatePost;
  keywords: string[];
  gallerySlugs: string[];
  intentWords: string[];
}) {
  const text = normalizeText(postSearchText(post));
  let score = 0;

  if (gallerySlugs.length > 0) {
    if (gallerySlugs.includes(post.gallerySlug)) {
      score += 30;
    } else {
      return 0;
    }
  }

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    if (normalizeText(post.title).includes(normalizedKeyword)) {
      score += 8;
    } else if (text.includes(normalizedKeyword)) {
      score += 3;
    }
  }

  for (const intentWord of intentWords) {
    const normalizedIntent = normalizeText(intentWord);
    if (!normalizedIntent) continue;

    if (text.includes(normalizedIntent)) {
      score += 10;
    }
  }

  score += Math.min(post.likeCount, 100) / 20;
  score += Math.min(post.commentCount, 50) / 10;

  return score;
}

async function askOllamaForRelatedPosts({
  source,
  candidates,
  gallerySlugs,
  intentWords,
}: {
  source: GoodsSourceInput;
  candidates: CandidatePost[];
  gallerySlugs: string[];
  intentWords: string[];
}) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

  if (!baseUrl) {
    throw new Error("OLLAMA_BASE_URL is not configured.");
  }

  const compactCandidates = candidates.slice(0, 25).map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content.slice(0, 300),
    postType: post.postType,
    galleryName: post.galleryName,
    gallerySlug: post.gallerySlug,
    tags: post.tags,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
  }));

  const prompt = `
너는 팬덤 굿즈 커뮤니티의 관련 게시글 추천 필터 AI다.

현재 굿즈/거래 정보:
- 제목: ${source.title}
- 설명: ${source.description ?? "없음"}
- 브랜드: ${source.brand ?? "없음"}
- 카테고리: ${source.category ?? "없음"}
- 태그: ${(source.tags ?? []).length ? source.tags?.join(", ") : "없음"}
- 추론된 갤러리 slug: ${gallerySlugs.length ? gallerySlugs.join(", ") : "없음"}
- 굿즈 유형 키워드: ${intentWords.length ? intentWords.join(", ") : "없음"}

후보 게시글 JSON:
${JSON.stringify(compactCandidates, null, 2)}

선택 규칙:
1. 현재 굿즈와 실제로 관련 있는 게시글만 고른다.
2. 최대 5개까지만 고른다.
3. 관련성이 낮으면 억지로 채우지 않는다.
4. 롤 피규어면 롤 갤러리 게시글 중 피규어, 굿즈, 구매, 후기, 정보 관련 글을 우선한다.
5. 이터널리턴 장패드면 이터널리턴 갤러리 게시글 중 장패드, 굿즈, 구매, 후기, 정보 관련 글을 우선한다.
6. 캐릭터명만 있어도 해당 팬덤 갤러리를 고려한다. 예: 아리 → 롤, 쿠로미 → 산리오, 토토로 → 지브리.
7. 다른 팬덤 게시글은 제외한다.
8. 출력은 반드시 JSON만 한다. 설명 문장 금지.

출력 형식:
{
  "selected": [
    {
      "id": "게시글 id",
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
    selected?: Array<{ id?: string; reason?: string }>;
  };

  return parsed.selected ?? [];
}

function fallbackRuleFilter(posts: CandidatePost[]) {
  return posts.slice(0, 5).map((post) => ({
    id: post.id,
    reason: "키워드와 갤러리 기준으로 관련성이 있어 선택됨",
  }));
}

function toRelatedPostItem(post: CandidatePost, reason?: string): RelatedPostItem {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    postType: post.postType,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    bookmarkCount: post.bookmarkCount,
    createdAt: post.createdAt,
    galleryName: post.galleryName,
    gallerySlug: post.gallerySlug,
    author: post.author,
    tags: post.tags,
    reason,
  };
}

export async function getRelatedPostsForGoods({
  supabase,
  source,
  excludePostIds = [],
}: {
  supabase: SupabaseClient;
  source: GoodsSourceInput;
  excludePostIds?: string[];
}): Promise<RelatedPostItem[]> {
  const { inferredGallerySlugs, keywords, intentWords } = buildSearchContext(source);

  const galleryResult = inferredGallerySlugs.length
    ? await supabase
        .from("galleries")
        .select("id,name,slug")
        .in("slug", inferredGallerySlugs)
    : { data: [] };

  const galleryRows = (galleryResult.data ?? []) as GalleryRow[];
  const galleryIds = galleryRows.map((gallery) => gallery.id);

  const filters = buildIlikeFilters(["title", "content"], keywords);

  let query = supabase
    .from("posts")
    .select(
      "id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,gallery_id,galleries(name,slug),profiles(nickname,email)"
    )
    .eq("is_deleted", false)
    .order("like_count", { ascending: false })
    .limit(40);

  if (galleryIds.length > 0) {
    query = query.in("gallery_id", galleryIds);
  }

  if (filters.length > 0) {
    query = query.or(filters.join(","));
  }

  let postResult = await query;

  if ((!postResult.data || postResult.data.length === 0) && galleryIds.length > 0) {
    postResult = await supabase
      .from("posts")
      .select(
        "id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,gallery_id,galleries(name,slug),profiles(nickname,email)"
      )
      .eq("is_deleted", false)
      .in("gallery_id", galleryIds)
      .order("like_count", { ascending: false })
      .limit(40);
  }

  const rawPosts = (postResult.data ?? []) as PostRow[];
  const postIds = rawPosts.map((post) => post.id);

  const tagResult = postIds.length
    ? await supabase
        .from("post_tags")
        .select("post_id,tags(name)")
        .in("post_id", postIds)
    : { data: [] };

  const tagRows = (tagResult.data ?? []) as PostTagRow[];

  const tagsByPostId = new Map<string, string[]>();

  for (const row of tagRows) {
    const tag = normalizeOne(row.tags);
    if (!tag?.name) continue;

    const prev = tagsByPostId.get(row.post_id) ?? [];
    tagsByPostId.set(row.post_id, unique([...prev, tag.name]));
  }

  const candidates: CandidatePost[] = rawPosts
    .filter((post) => !excludePostIds.includes(post.id))
    .map((post) => {
      const gallery = normalizeOne(post.galleries);
      const profile = normalizeOne(post.profiles);
      const tags = tagsByPostId.get(post.id) ?? [];

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        postType: post.post_type,
        likeCount: post.like_count ?? 0,
        commentCount: post.comment_count ?? 0,
        bookmarkCount: post.bookmark_count ?? 0,
        createdAt: post.created_at,
        galleryName: gallery?.name ?? "",
        gallerySlug: gallery?.slug ?? "",
        author: profile?.nickname ?? profile?.email ?? "회원",
        tags,
        score: 0,
      };
    })
    .map((post) => ({
      ...post,
      score: scorePost({
        post,
        keywords,
        gallerySlugs: inferredGallerySlugs,
        intentWords,
      }),
    }))
    .filter((post) => post.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) {
    return [];
  }

  let selected: Array<{ id?: string; reason?: string }> = [];

  const shouldUseOllama =
    process.env.USE_OLLAMA_RECOMMENDER === "true" &&
    Boolean(process.env.OLLAMA_BASE_URL);

  if (shouldUseOllama) {
    try {
      selected = await askOllamaForRelatedPosts({
        source,
        candidates,
        gallerySlugs: inferredGallerySlugs,
        intentWords,
      });
    } catch (error) {
      console.error("related posts ollama failed:", error);
      selected = fallbackRuleFilter(candidates);
    }
  } else {
    selected = fallbackRuleFilter(candidates);
  }

  const selectedIds = new Set<string>();
  const result: RelatedPostItem[] = [];

  for (const selectedItem of selected) {
    if (!selectedItem.id) continue;
    if (selectedIds.has(selectedItem.id)) continue;

    const post = candidates.find((candidate) => candidate.id === selectedItem.id);
    if (!post) continue;

    selectedIds.add(selectedItem.id);
    result.push(toRelatedPostItem(post, selectedItem.reason));

    if (result.length >= 5) break;
  }

  return result;
}