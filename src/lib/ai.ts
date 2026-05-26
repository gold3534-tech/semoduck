type JsonValue = Record<string, unknown>;

const fallbackTags = ["굿즈", "정보", "후기", "교환", "공식"];
const fallbackProductKeywords = ["공식 굿즈", "키링", "포토카드"];
const genericKeywords = new Set([
  "세모덕",
  "팬덤",
  "커뮤니티",
  "글쓰기",
  "게시글",
  "굿즈",
  "상품",
  "추천",
  "검색"
]);
const promptCache = new Map<string, JsonValue | null>();

function asStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim().replace(/^#/, "")).filter(Boolean).slice(0, limit);
}

function compactText(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 3000);
}

function cleanKeyword(value: string) {
  return value.trim().replace(/^#/, "").replace(/\s+/g, " ");
}

function mergeKeywords(groups: string[][], limit: number) {
  const merged: string[] = [];
  for (const group of groups) {
    for (const keyword of group.map(cleanKeyword)) {
      if (keyword.length < 2 || genericKeywords.has(keyword)) continue;
      if (!merged.some((item) => item.toLowerCase() === keyword.toLowerCase())) {
        merged.push(keyword);
      }
      if (merged.length >= limit) return merged;
    }
  }
  return merged;
}

async function callOllama(prompt: string): Promise<JsonValue | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3.2:3b";
  const cacheKey = `${model}:${prompt}`;

  if (!baseUrl) return null;
  if (promptCache.has(cacheKey)) return promptCache.get(cacheKey) ?? null;

  try {
    const timeout = Math.min(Number(process.env.OLLAMA_TIMEOUT_MS ?? 1800), 1800);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          num_predict: 300
        }
      }),
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { response?: string };
    const parsed = data.response ? (JSON.parse(data.response) as JsonValue) : null;
    promptCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    promptCache.set(cacheKey, null);
    return null;
  }
}

function fallbackKeywordExtract(input: string, limit = 6) {
  const words = compactText(input)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !["그리고", "하지만", "있는", "없는", "합니다", "주세요"].includes(word));
  return [...new Set(words)].slice(0, limit);
}

export async function extractTags(input: string) {
  const text = compactText(input);
  const prompt = `너는 한국 팬덤 커뮤니티 '세모덕'의 글쓰기 보조 AI다.
아래 글에서 게시글 태그 5개, 카테고리 1개, 굿즈 검색 키워드 3개를 추출해라.
반드시 JSON만 반환해라.
형식: {"tags":["..."],"category":"...","product_keywords":["..."]}
글:
${text}`;
  const ai = await callOllama(prompt);
  const tags = asStringArray(ai?.tags, 5);
  const productKeywords = asStringArray(ai?.product_keywords, 3);
  const fallbackKeywords = fallbackKeywordExtract(text, 6);
  return {
    tags: mergeKeywords([tags, fallbackKeywords, fallbackTags], 5),
    category: typeof ai?.category === "string" && cleanKeyword(ai.category) ? cleanKeyword(ai.category) : "팬덤",
    product_keywords: mergeKeywords([fallbackKeywords, productKeywords, fallbackProductKeywords], 3)
  };
}

export async function extractProductKeywords(input: string) {
  const text = compactText(input);
  const prompt = `너는 팬덤 굿즈 추천용 키워드 추출 AI다.
아래 텍스트에서 실제 굿즈 검색에 쓸 키워드 3~6개를 뽑아라.
작품명, 캐릭터명, 굿즈 종류를 우선하고 너무 넓은 단어는 제외해라.
반드시 JSON만 반환해라.
형식: {"product_keywords":["..."]}
텍스트:
${text}`;
  const ai = await callOllama(prompt);
  const productKeywords = asStringArray(ai?.product_keywords, 6);
  return {
    product_keywords: mergeKeywords([fallbackKeywordExtract(text, 6), productKeywords, fallbackProductKeywords], 6)
  };
}

export async function extractPostKeywords(input: string) {
  const text = compactText(input);
  const prompt = `너는 팬덤 커뮤니티 관련 게시글 추천 AI다.
아래 텍스트와 관련된 게시글을 찾기 위한 검색 키워드 3~6개를 뽑아라.
작품명, 캐릭터명, 굿즈명, 거래 조건을 우선해라.
반드시 JSON만 반환해라.
형식: {"post_keywords":["..."]}
텍스트:
${text}`;
  const ai = await callOllama(prompt);
  const postKeywords = asStringArray(ai?.post_keywords, 6);
  return {
    post_keywords: mergeKeywords([fallbackKeywordExtract(text, 6), postKeywords], 6)
  };
}

export async function summarizeGallery(input: string) {
  const text = compactText(input);
  const prompt = `너는 한국 팬덤 갤러리의 인기 흐름을 요약하는 AI다.
아래 게시글 목록을 보고 1문장 요약, 주요 토픽 3개, 인기 키워드 6개를 반환해라.
반드시 JSON만 반환해라.
형식: {"summary":"...","topics":["..."],"keywords":["..."]}
게시글:
${text}`;
  const ai = await callOllama(prompt);
  const topics = asStringArray(ai?.topics, 3);
  const keywords = asStringArray(ai?.keywords, 6);
  const fallbackKeywords = fallbackKeywordExtract(text, 6);
  return {
    summary: typeof ai?.summary === "string" && ai.summary.trim() ? ai.summary.trim() : "최근 갤러리에서는 굿즈 정보와 거래, 후기 이야기가 활발합니다.",
    topics: mergeKeywords([topics, fallbackKeywords], 3),
    keywords: mergeKeywords([keywords, fallbackKeywords], 6)
  };
}
