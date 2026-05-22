"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
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

const pageSize = 12;

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
    if (!keyword.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setPage(1);

    try {
      const response = await fetch(`/api/products/external-search?q=${encodeURIComponent(keyword)}&display=300`);
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
    if (initialQuery) {
      searchGoods(undefined, initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">굿즈 검색</p>
        <h1 className="mt-2 text-3xl font-black">팬덤 굿즈와 판매 링크를 찾아봐요</h1>
      </div>

      <Card>
        <form onSubmit={searchGoods} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 focus-within:border-berry">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full outline-none" placeholder="쿠로미 키링, 포켓몬 카드, BTS 포토카드" />
          </div>
          <Button disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            네이버 검색
          </Button>
        </form>
      </Card>

      {searched ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">검색 결과</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">{normalizedQuery || query} 기준으로 찾은 외부 판매 링크입니다.</p>
            </div>
            {items.length ? <p className="text-sm font-black text-slate-500">총 {items.length}개 · {page} / {totalPages}페이지</p> : null}
          </div>
          {error && <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pagedItems.map((item) => (
              <Card key={item.id} className="flex h-full flex-col overflow-hidden p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-100">
                  {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /> : null}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 font-black text-ink">{item.title}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="mint">네이버</Badge>
                    <Badge>{item.mallName}</Badge>
                  </div>
                  {item.category && <p className="line-clamp-2 text-xs font-bold text-slate-400">{item.category}</p>}
                  <p className="mt-auto text-lg font-black">{formatPrice(item.price)}</p>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-white">
                    판매 링크 열기
                    <ExternalLink size={15} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
          {!items.length && !loading && <Card>검색 결과가 없습니다. 캐릭터명과 굿즈 종류를 같이 입력해 보세요.</Card>}
          {items.length > pageSize && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                이전
              </Button>
              <span className="min-w-24 text-center text-sm font-black text-slate-600">
                {page} / {totalPages}
              </span>
              <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                다음
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-black">추천 굿즈</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">관심사를 설정하지 않은 계정에는 인기 주제와 최근 등록 상품을 기준으로 보여줍니다.</p>
          </div>
          {recommendedGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-lg font-black">{group.title}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
