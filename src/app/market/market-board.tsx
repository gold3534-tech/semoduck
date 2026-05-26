"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, tradeStatusLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import type { Gallery } from "@/types/domain";

const pageSize = 10;
const filters = ["전체", "판매", "교환", "나눔", "거래 가능", "예약중", "거래완료"];

type TradeType = "sell" | "exchange" | "giveaway";
type MarketItem = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  trade_type: TradeType;
  status: "active" | "reserved" | "completed" | "hidden" | "reported";
  price: number;
  region: string | null;
  image_url: string | null;
  created_at: string;
  profiles?: { nickname?: string | null; email?: string | null } | null;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

export function MarketBoard({
  initialItems
}: {
  initialItems: MarketItem[];
  galleries: Gallery[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const [filter, setFilter] = useState("전체");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return initialItems.filter((item) => {
      const matchesFilter = filter === "전체" || tradeTypeLabel(item.trade_type) === filter || tradeStatusLabel(item.status) === filter;
      const searchable = [item.title, item.description, item.region, item.galleries?.name, item.profiles?.nickname, item.profiles?.email].filter(Boolean).join(" ").toLowerCase();
      return matchesFilter && (!normalized || searchable.includes(normalized));
    });
  }, [filter, initialItems, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  return (
    <div className="space-y-3">
      <Card className="grid gap-3 p-3 lg:grid-cols-[1fr_minmax(14rem,20rem)_auto] lg:items-center">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-black ${filter === item ? "bg-[#ff6f9b] text-white" : "bg-white text-[#4b3a6d] ring-1 ring-[#ead8f4] hover:bg-[#fff1f7]"}`}>
              {item}
            </button>
          ))}
        </div>
        <label className="flex min-h-9 items-center gap-2 rounded-full border border-[#ead8f4] bg-white px-3 focus-within:border-[#b984e7]">
          <Search size={15} className="shrink-0 text-[#8b61c8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-xs font-bold outline-none"
            placeholder="제목, 갤러리, 지역 검색"
          />
        </label>
        <Link href="/market/new" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6f9b] to-[#a56be8] px-3 py-1.5 text-xs font-black text-white shadow-sm hover:brightness-105">
          <Plus size={16} />
          거래 글쓰기
        </Link>
      </Card>

      <div className="space-y-3">
        {paginated.map((item) => (
          <Card key={item.id} className="grid gap-4 overflow-hidden p-3 md:grid-cols-[13rem_1fr_auto] md:items-center">
            <Link href={`/market/${item.id}`} className="block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#f7f2fb]">
                {item.image_url ? <Image src={item.image_url} alt={item.title} fill className="object-cover" sizes="208px" /> : null}
              </div>
            </Link>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {item.galleries?.name ? <Badge>{item.galleries.name}</Badge> : null}
                <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                <Badge tone={item.status === "active" ? "pink" : "sun"}>{tradeStatusLabel(item.status)}</Badge>
              </div>
              <Link href={`/market/${item.id}`} className="block text-lg font-black text-[#2f2352] hover:text-[#ff6f9b]">
                {item.title}
              </Link>
              <p className="text-xl font-black text-[#ff5f8d]">{tradeValueLabel(item.trade_type, item.price)}</p>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span className="rounded-full bg-cloud px-2.5 py-1">{item.region || "거래 방식 미입력"}</span>
                <span className="rounded-full bg-cloud px-2.5 py-1">{formatDateTime(item.created_at)}</span>
              </div>
              <p className="text-xs font-bold text-slate-500">작성자 {item.profiles?.nickname ?? item.profiles?.email ?? "회원"}</p>
              <p className="line-clamp-2 text-xs leading-5 text-slate-600">{item.description}</p>
            </div>
            <Link href={`/market/${item.id}`} className="hidden text-[#8b61c8] md:block">
              &gt;
            </Link>
          </Card>
        ))}
        {!paginated.length ? <Card className="p-6 text-center text-sm font-bold text-slate-500">조건에 맞는 유저거래 글이 없습니다.</Card> : null}
      </div>

      {filtered.length > pageSize ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
          <p className="text-xs font-black text-slate-500">
            {filtered.length.toLocaleString("ko-KR")}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)}개
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-9 min-h-9 w-9 rounded-full p-0" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="이전 페이지">
              <ChevronLeft size={18} />
            </Button>
            <span className="min-w-16 text-center text-xs font-black text-[#3a285f]">
              {page} / {pageCount}
            </span>
            <Button variant="secondary" className="h-9 min-h-9 w-9 rounded-full p-0" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="다음 페이지">
              <ChevronRight size={18} />
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
