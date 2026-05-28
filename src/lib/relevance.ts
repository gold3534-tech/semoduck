const genericTokens = new Set([
  "굿즈",
  "상품",
  "공식",
  "판매",
  "구매",
  "교환",
  "나눔",
  "가격",
  "정보",
  "후기",
  "관련",
  "추천",
  "갤러리",
  "세모덕",
  "링크",
  "판매처",
  "확인",
  "상태",
  "희망",
  "문의"
]);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractRelevantTokens(values: Array<string | null | undefined>, limit = 12) {
  const source = normalizeText(values.filter(Boolean).join(" "));
  const tokens = source
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !genericTokens.has(token) && !/^\d+$/.test(token));

  const compactPhrases = values
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeText(value).replace(/\s+/g, ""))
    .filter((value) => value.length >= 3 && !genericTokens.has(value));

  return [...new Set([...compactPhrases, ...tokens])].slice(0, limit);
}

export function scoreTextRelevance(targetValues: Array<string | null | undefined>, keywords: string[]) {
  const target = normalizeText(targetValues.filter(Boolean).join(" "));
  const compactTarget = target.replace(/\s+/g, "");
  const normalizedKeywords = extractRelevantTokens(keywords, 20);

  let score = 0;
  for (const keyword of normalizedKeywords) {
    const compactKeyword = keyword.replace(/\s+/g, "");
    if (!compactKeyword) continue;
    if (compactTarget === compactKeyword) score += 120;
    else if (compactTarget.includes(compactKeyword)) score += compactKeyword.length >= 5 ? 55 : 30;
    else if (target.includes(keyword)) score += 18;
  }

  return score;
}

export function sortByRelevance<T>(
  items: T[],
  keywords: string[],
  getText: (item: T) => Array<string | null | undefined>,
  getTieBreaker: (item: T) => number = () => 0,
  minScore = 20
) {
  return items
    .map((item) => ({ item, score: scoreTextRelevance(getText(item), keywords) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || getTieBreaker(b.item) - getTieBreaker(a.item))
    .map(({ item }) => item);
}
