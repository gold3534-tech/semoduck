import { NextResponse } from "next/server";
import { searchNaverShopping } from "@/lib/external/naver-shopping";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "쿠로미 키링";
  const requestedDisplay = Math.min(Math.max(Number(searchParams.get("display") ?? 300), 1), 1000);
  const start = Math.min(Math.max(Number(searchParams.get("start") ?? 1), 1), 1000);
  const pageSize = 100;
  const pages = await Promise.all(
    Array.from({ length: Math.ceil(requestedDisplay / pageSize) }, (_, index) => {
      const pageStart = start + index * pageSize;
      if (pageStart > 1000) return null;
      return searchNaverShopping(query, Math.min(pageSize, requestedDisplay - index * pageSize), pageStart);
    }).filter((request): request is ReturnType<typeof searchNaverShopping> => Boolean(request))
  );

  const first = pages[0];
  const seen = new Set<string>();
  const items = pages.flatMap((page) => page.items).filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return NextResponse.json({
    query: first?.query ?? query,
    usedMock: pages.some((page) => page.usedMock),
    error: pages.find((page) => page.error)?.error ?? null,
    total: first?.total ?? 0,
    items
  });
}
