"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, Grid3X3, Heart, Loader2, Package, Search, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
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

const pageSize = 18;
const quickTerms = ["쿠로미", "산리오", "포켓몬", "BTS", "원피스", "스파이패밀리"];

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
  }, [initialQuery]);

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[1.5rem] border-2 border-[#cfa9ed] bg-[#fbf4ff] p-5 shadow-[0_12px_34px_rgba(126,80,178,0.06)]">
        <Image src="/semoduck-goods-hero.png" alt="" width={360} height={220} priority className="pointer-events-none absolute bottom-0 right-8 hidden h-44 w-auto object-contain lg:block" />
        <div className="relative max-w-xl pr-0 lg:pr-40">
          <h1 className="text-3xl font-black leading-tight text-[#6f4ab4] md:text-4xl">굿즈 검색</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#44385a]">원하는 굿즈를 검색하고 판매 링크와 추천 상품을 한눈에 확인하세요.</p>
          <form onSubmit={searchGoods} className="mt-4 flex max-w-xl items-center gap-3 rounded-full border-2 border-[#9b63d6] bg-white px-4 py-2.5 shadow-[0_12px_30px_rgba(163,108,224,0.12)]">
            <Search size={18} className="text-[#6f4ab4]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" placeholder="쿠로미 키링" />
            <Button disabled={loading} className="hidden sm:inline-flex">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              검색
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#5e4b76]">
            <span>인기 검색어</span>
            {quickTerms.map((word) => (
              <button key={word} type="button" onClick={() => searchGoods(undefined, word)} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-[#ead8f4]">
                {word}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Card className="grid gap-2 p-3 md:grid-cols-6">
        {[
          ["전체", Grid3X3],
          ["인기", Star],
          ["신상품", Sparkles],
          ["거래중", Package],
          ["공식 우선", ShieldCheck],
          ["배송", Truck]
        ].map(([label, Icon]) => (
          <button key={label as string} type="button" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-black text-[#4b3a6d] ring-1 ring-[#ead8f4] hover:bg-[#fff1f7]">
            <Icon size={16} />
            {label as string}
          </button>
        ))}
      </Card>

      {searched ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">검색 결과</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">{normalizedQuery || query} 기준으로 찾은 외부 판매 링크입니다.</p>
            </div>
            {items.length ? <p className="text-sm font-black text-slate-500">총 {items.length}개 · {page} / {totalPages}페이지</p> : null}
          </div>
          {error && <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {pagedItems.map((item) => (
              <Card key={item.id} className="group flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f2fb]">
                  {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 220px" /> : null}
                  <span className="absolute left-3 top-3 rounded-full bg-[#ff6f9b] px-3 py-1 text-xs font-black text-white">상품</span>
                  <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#ff6f9b] ring-1 ring-[#f4dbe7]"><Heart size={17} /></span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  <p className="line-clamp-2 text-sm font-black text-[#2f2352]">{item.title}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="mint">네이버</Badge>
                    <Badge>{item.mallName}</Badge>
                  </div>
                  {item.category && <p className="line-clamp-2 text-xs font-bold text-slate-400">{item.category}</p>}
                  <p className="mt-auto text-base font-black text-[#ff5f8d]">{formatPrice(item.price)}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl bg-[#3a285f] px-3 text-xs font-black text-white">
                    판매 링크 열기
                    <ExternalLink size={14} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
          {!items.length && !loading && <Card>검색 결과가 없습니다. 캐릭터명과 굿즈 종류를 같이 입력해 보세요.</Card>}
          {items.length > pageSize && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>이전</Button>
              <span className="min-w-24 text-center text-sm font-black text-slate-600">{page} / {totalPages}</span>
              <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>다음</Button>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-black">추천 굿즈</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">관심사와 인기 주제를 기준으로 보여줍니다.</p>
          </div>
          {recommendedGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-base font-black">{group.title}</h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
          {!recommendedGroups.length && <Card>관심사를 설정하면 추천 굿즈가 표시됩니다.</Card>}
        </section>
      )}
    </div>
  );
}
