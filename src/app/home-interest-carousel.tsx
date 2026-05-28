"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import type { Product } from "@/types/domain";

type MarketPreview = {
  id: string;
  title: string;
  description?: string | null;
  trade_type: string;
  price: number;
  image_url: string | null;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

export type HomeInterestItem =
  | { kind: "official"; product: Product }
  | { kind: "market"; market: MarketPreview };

function getProductPrice(product: Product) {
  const prices = product.offers
    .map((offer) => offer.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

export function HomeInterestCarousel({
  items,
  interests,
}: {
  items: HomeInterestItem[];
  interests: string[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "prev" | "next") {
    scrollerRef.current?.scrollBy({
      left: direction === "next" ? 280 : -280,
      behavior: "smooth",
    });
  }

  const visibleItems = items
    .filter((item) => {
      if (item.kind === "official") {
        return !item.product.id.startsWith("fallback-");
      }

      return true;
    })
    .slice(0, 9);

  if (!visibleItems.length) {
    return (
      <div className="rounded-2xl border border-[#ead8f4] bg-white/90 p-4 text-xs font-bold text-slate-500">
        관심사와 맞는 공식 굿즈나 유저거래가 아직 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[#8d6fc2]">
            내 관심사 기반
          </p>

          <h2 className="mt-0.5 text-xl font-black leading-6 text-[#2f2352]">
            공식 굿즈와 유저거래
          </h2>

          <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">
            {interests.length
              ? `${interests.map((interest) => `#${interest}`).join(" ")} 기준으로 보여줍니다.`
              : "인기 관심사 기준으로 보여줍니다."}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scroll("prev")}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6f4ab4] shadow-sm ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7]"
            aria-label="이전 추천 보기"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={() => scroll("next")}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#4c3078] text-white shadow-sm transition hover:bg-[#3f2868]"
            aria-label="다음 추천 보기"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        id="home-interest-carousel"
        className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleItems.map((item) =>
          item.kind === "official" ? (
            <OfficialGoodsSlide
              key={`official-${item.product.id}`}
              product={item.product}
            />
          ) : (
            <MarketSlide
              key={`market-${item.market.id}`}
              market={item.market}
            />
          ),
        )}
      </div>
    </div>
  );
}

function OfficialGoodsSlide({ product }: { product: Product }) {
  const primaryOffer =
    product.offers.find((offer) => offer.isOfficial) ?? product.offers[0];

  const price = getProductPrice(product);
  const href = `/goods/${product.id}`;
  const mallName = primaryOffer?.mallName || product.brand || product.category;

  return (
    <Card className="relative flex min-w-[6.75rem] max-w-[6.75rem] snap-start flex-col overflow-hidden rounded-[1rem] p-0 sm:min-w-[7.15rem] sm:max-w-[7.15rem]">
      <Link href={href} className="group block">
        <div className="relative h-[3.75rem] overflow-hidden rounded-t-[1rem] bg-slate-100 sm:h-16">
          <SafeImage
            src={product.image}
            alt={product.title}
            kind="product"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col gap-0.5 p-1.5">
          <div className="flex flex-wrap gap-1">
            <Badge tone="pink">공식몰</Badge>
          </div>

          <p className="line-clamp-2 min-h-[2rem] text-[10.5px] font-black leading-4 text-[#2f2352]">
            {product.title}
          </p>

          <p className="line-clamp-1 text-[10.5px] font-black text-[#ff5f8d]">
            {price > 0 ? formatPrice(price) : "가격 정보 없음"}
          </p>

          <p className="line-clamp-1 text-[9.5px] font-bold text-slate-500">
            {mallName || "공식 굿즈"}
          </p>
        </div>
      </Link>
    </Card>
  );
}

function MarketSlide({ market }: { market: MarketPreview }) {
  return (
    <Link
      href={`/market/${market.id}`}
      className="block min-w-[6.75rem] max-w-[6.75rem] snap-start sm:min-w-[7.15rem] sm:max-w-[7.15rem]"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-[1rem] p-0 transition hover:bg-pink-50">
        <div className="relative h-[3.75rem] overflow-hidden rounded-t-[1rem] bg-slate-100 sm:h-16">
          <SafeImage
            src={market.image_url}
            alt={market.title}
            kind="product"
            className="h-full w-full object-cover transition hover:scale-105"
          />
        </div>

        <div className="flex flex-col gap-0.5 p-1.5">
          <div className="flex flex-wrap gap-1">
            <Badge tone="mint">유저거래</Badge>
            <Badge tone="gray">{tradeTypeLabel(market.trade_type)}</Badge>
          </div>

          <p className="line-clamp-2 min-h-[2rem] text-[10.5px] font-black leading-4 text-[#2f2352]">
            {market.title}
          </p>

          <p className="line-clamp-1 text-[10.5px] font-black text-[#ff5f8d]">
            {tradeValueLabel(market.trade_type, market.price)}
          </p>

          <p className="line-clamp-1 text-[9.5px] font-bold text-slate-500">
            {market.galleries?.name ?? "갤러리"}
          </p>
        </div>
      </Card>
    </Link>
  );
}