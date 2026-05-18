"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
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
  items: ExternalGoodsItem[];
};

export function GoodsSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("쿠로미 키링");
  const [items, setItems] = useState<ExternalGoodsItem[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function searchGoods(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(`/api/products/external-search?q=${encodeURIComponent(query)}&display=12`);
      const data = (await response.json()) as ExternalGoodsResponse;
      setItems(data.items);
      setError(data.error ?? "");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "상품 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">굿즈 검색</p>
        <h1 className="mt-2 text-3xl font-black">네이버 쇼핑 결과와 세모덕 굿즈를 함께 비교해요</h1>
      </div>

      <Card>
        <form onSubmit={searchGoods} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 focus-within:border-berry">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full outline-none" placeholder="쿠로미 키링, 포토카드 바인더..." />
          </div>
          <Button disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            네이버 검색
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {["인기순", "낮은 가격순", "최신순", "공식", "중고"].map((filter, index) => (
            <Badge key={filter} tone={index === 0 ? "pink" : "gray"}>
              {filter}
            </Badge>
          ))}
        </div>
      </Card>

      {searched && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-black">네이버 쇼핑 검색 결과</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{query} 기준</p>
          </div>
          {error && <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
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
                    쇼핑몰 열기
                    <ExternalLink size={15} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
          {!items.length && !loading && <Card>검색 결과가 없습니다.</Card>}
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black">세모덕 추천 굿즈</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Supabase에 등록된 상품과 판매 링크입니다.</p>
          </div>
          <Link href="/posts/new" className="text-sm font-black text-slate-500 hover:text-ink">
            글쓰기
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
