type JsonValue = Record<string, unknown>;

async function callOllama(prompt: string): Promise<JsonValue | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3.1";

  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json"
      }),
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { response?: string };
    return data.response ? (JSON.parse(data.response) as JsonValue) : null;
  } catch {
    return null;
  }
}

export async function extractTags(input: string) {
  const prompt = `다음 한국어 팬덤 커뮤니티 글에서 태그 5개와 카테고리 1개를 JSON으로만 반환해. 입력: ${input}`;
  const ai = await callOllama(prompt);
  if (ai?.tags && ai?.category) return ai;
  return {
    tags: ["쿠로미", "키링", "산리오", "정품굿즈", "구매질문"],
    category: "캐릭터굿즈"
  };
}

export async function extractProductKeywords(input: string) {
  const prompt = `다음 글에서 굿즈 검색 키워드 3개를 product_keywords 배열 JSON으로만 반환해. 입력: ${input}`;
  const ai = await callOllama(prompt);
  if (ai?.product_keywords) return ai;
  return {
    product_keywords: ["쿠로미 아크릴 키링", "산리오 쿠로미 키링", "쿠로미 정품 굿즈"]
  };
}

export async function summarizeGallery(input: string) {
  const prompt = `다음 갤러리 인기글 목록을 요약해서 summary, topics, keywords JSON으로만 반환해. 입력: ${input}`;
  const ai = await callOllama(prompt);
  if (ai?.summary) return ai;
  return {
    summary: "오늘 산리오 갤러리에서는 쿠로미 키링 재입고와 공식몰 예약판매 관련 이야기가 많았습니다.",
    topics: ["쿠로미 키링 재입고", "공식몰 예약판매", "중고 양도글 증가"],
    keywords: ["쿠로미", "키링", "예약판매", "재입고"]
  };
}
