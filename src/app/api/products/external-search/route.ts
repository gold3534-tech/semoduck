import { NextResponse } from "next/server";
import { searchNaverShopping } from "@/lib/external/naver-shopping";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "쿠로미 키링";
  const display = Number(searchParams.get("display") ?? 40);
  const start = Number(searchParams.get("start") ?? 1);
  const naver = await searchNaverShopping(query, Math.min(Math.max(display, 1), 100), start);

  return NextResponse.json({
    query: naver.query,
    usedMock: naver.usedMock,
    error: naver.error ?? null,
    total: naver.total,
    items: naver.items
  });
}
