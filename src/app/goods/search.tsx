"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductLikeButton } from "@/components/product-like-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { externalGoodsDetailHref } from "@/lib/goods-detail-link";
import type { Product } from "@/types/domain";

type ExternalGoodsItem = {
  id: string;
  title: string;
  image?: string;
  mallName: string;
  price: number;
  url: string;
  category?: string;
};

type ExternalGoodsResponse = {
  query: string;
  usedMock: boolean;
  error: string | null;
  total: number;
  items: ExternalGoodsItem[];
};

export type RecommendedGoodsGroup = {
  title: string;
  products: Product[];
};

const pageSize = 12;
const quickTerms = ["쿠로미", "산리오", "포켓몬", "BTS", "원피스", "스파이패밀리"];

function RecommendedGoodsCarousel({ group }: { group: RecommendedGoodsGroup }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth"
    });
  };

  return (
    <div>
      <div className="mb-2">
        <h3 className="text-sm font-black">{group.title}</h3>
      </div>
      <div className="relative">
        {group.products.length > 4 ? (
          <>
            <Button type="button" variant="secondary" className="absolute left-2 top-1/2 z-20 h-10 min-h-10 w-10 -translate-y-1/2 rounded-full bg-white/95 p-0 shadow-soft" onClick={() => scroll("left")} aria-label={`${group.title} 이전`}>
              <ChevronLeft size={18} />
            </Button>
            <Button type="button" variant="secondary" className="absolute right-2 top-1/2 z-20 h-10 min-h-10 w-10 -translate-y-1/2 rounded-full bg-white/95 p-0 shadow-soft" onClick={() => scroll("right")} aria-label={`${group.title} 다음`}>
              <ChevronRight size={18} />
            </Button>
          </>
        ) : null}
        <div ref={scrollerRef} className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {group.products.map((product) => (
            <div key={product.id} className="min-w-[14rem] max-w-[14rem] snap-start md:min-w-[14.25rem] md:max-w-[14.25rem]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GoodsSearch({ recommendedGroups, initialQuery = "" }: { recommendedGroups: RecommendedGoodsGroup[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery || "쿠로미 키링");
  const [items, setItems] = useState<ExternalGoodsItem[]>([]);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(Boolean(initialQuery));
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  async function searchGoods(event?: FormEvent<HTMLFormElement>, keyword = query) {
    event?.preventDefault();
    const nextKeyword = keyword.trim();
    if (!nextKeyword) return;

    setQuery(nextKeyword);
    setLoading(true);
    setError("");
    setSearched(true);
    setPage(1);

    try {
      const response = await fetch(`/api/products/external-search?q=${encodeURIComponent(nextKeyword)}&display=300`);
      const data = (await response.json()) as ExternalGoodsResponse;
      setItems(data.items);
      setNormalizedQuery(data.query);
      setError(data.error ?? "");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "상품 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) searchGoods(undefined, initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-2xl border-2 border-[#cfa9ed] bg-[#fbf4ff] p-4 shadow-[0_10px_26px_rgba(126,80,178,0.05)]">
        <Image src="/semoduck-goods-hero.png" alt="" width={320} height={190} priority className="pointer-events-none absolute bottom-0 right-8 hidden h-32 w-auto object-contain lg:block" />
        <div className="relative max-w-xl pr-0 lg:pr-40">
          <h1 className="text-2xl font-black leading-tight text-[#6f4ab4] md:text-3xl">굿즈 검색</h1>
          <p className="mt-1 text-xs font-bold leading-5 text-[#44385a]">원하는 굿즈와 판매 링크, 추천 상품을 한눈에 확인하세요.</p>
          <form onSubmit={searchGoods} className="mt-3 flex max-w-lg items-center gap-2 rounded-full border-2 border-[#9b63d6] bg-white px-3 py-2 shadow-[0_10px_22px_rgba(163,108,224,0.1)]">
            <Search size={17} className="text-[#6f4ab4]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" placeholder="쿠로미 키링" />
            <Button disabled={loading} className="min-h-8 rounded-xl px-3 py-1 text-xs">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              검색
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#5e4b76]">
            <span>인기 검색어</span>
            {quickTerms.map((word) => (
              <button key={word} type="button" onClick={() => searchGoods(undefined, word)} className="rounded-full bg-white px-2.5 py-1 text-[11px] ring-1 ring-[#ead8f4]">
                {word}
              </button>
            ))}
          </div>
        </div>
      </section>

      {searched ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">검색 결과</h2>
              <p className="mt-0.5 text-xs font-bold text-slate-500">{normalizedQuery || query} 기준으로 찾은 외부 판매 링크입니다.</p>
            </div>
            {items.length ? (
              <p className="text-xs font-black text-slate-500">
                총 {items.length}개 · {page} / {totalPages}페이지
              </p>
            ) : null}
          </div>
          {error && <p className="rounded-lg bg-amber-50 p-2.5 text-xs font-bold text-amber-700">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {pagedItems.map((item) => (
              <Card key={item.id} className="group relative flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5">
                <Link href={externalGoodsDetailHref({ title: item.title, image: item.image, mallName: item.mallName, price: item.price, url: item.url, category: item.category })} className="absolute inset-0 z-10" aria-label={`${item.title} 상세 보기`} />
                <div className="relative aspect-[16/10] overflow-hidden bg-[#f7f2fb]">
                  {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover transition group-hover:scale-[1.03]" sizes="(max-width: 768px) 50vw, 280px" /> : null}
                  <span className="absolute left-2 top-2 rounded-full bg-[#ff6f9b] px-2.5 py-0.5 text-[11px] font-black text-white">상품</span>
                  <div className="absolute right-2 top-2 z-20">
                    <ProductLikeButton productId={`external:${item.id}`} compact />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2.5">
                  <p className="line-clamp-2 text-sm font-black leading-5 text-[#2f2352]">{item.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="mint">네이버</Badge>
                    <Badge>{item.mallName}</Badge>
                  </div>
                  {item.category && <p className="line-clamp-1 text-[11px] font-bold text-slate-400">{item.category}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#ff5f8d]">{formatPrice(item.price)}</p>
                    <span className="rounded-full bg-[#fbf4ff] px-2.5 py-1 text-[11px] font-black text-[#6f4ab4]">상세 보기</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {!items.length && !loading && <Card className="p-3 text-sm font-bold text-slate-500">검색 결과가 없습니다. 캐릭터명과 굿즈 종류를 같이 입력해 보세요.</Card>}
          {items.length > pageSize && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                이전
              </Button>
              <span className="min-w-20 text-center text-xs font-black text-slate-600">{page} / {totalPages}</span>
              <Button variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                다음
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-black">추천 굿즈</h2>
            <p className="mt-0.5 text-xs font-bold text-slate-500">관심사와 인기 주제를 기준으로 보여줍니다.</p>
          </div>
          {recommendedGroups.map((group) => (
            <RecommendedGoodsCarousel key={group.title} group={group} />
          ))}
          {!recommendedGroups.length && <Card className="p-3 text-sm font-bold text-slate-500">관심사를 설정하면 추천 굿즈가 표시됩니다.</Card>}
        </section>
      )}
    </div>
  );
}
