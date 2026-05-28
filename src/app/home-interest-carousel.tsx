"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import type { Product } from "@/types/domain";

type MarketPreview = {
  id: string;
  title: string;
  trade_type: string;
  price: number;
  image_url: string | null;
  galleries?: { name?: string | null } | null;
};

export type HomeInterestItem =
  | { kind: "official"; product: Product }
  | { kind: "market"; market: MarketPreview };

export function HomeInterestCarousel({
  items,
  interests,
}: {
  items: HomeInterestItem[];
  interests: string[];
}) {
  function scroll(direction: "prev" | "next") {
    const element = document.getElementById("home-interest-carousel");
    if (!element) return;

    element.scrollBy({
      left: direction === "next" ? 360 : -360,
      behavior: "smooth",
    });
  }

  const visibleItems = items.filter((item) => {
    if (item.kind === "official") {
      return !item.product.id.startsWith("fallback-");
    }

    return true;
  });

  if (!visibleItems.length) {
    return (
      <Card className="rounded-2xl border border-[#ead8f4] bg-white/90 p-5 text-sm font-bold text-slate-500">
        관심사와 맞는 공식 굿즈나 유저거래가 아직 없습니다.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black text-berry">내 관심사 기반</p>
          <h2 className="text-xl font-black">공식 굿즈와 유저거래</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {interests.length
              ? interests.map((interest) => `#${interest}`).join(" ")
              : "인기 관심사"}{" "}
            기준으로 보여줍니다.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll("prev")}
            className="grid h-10 w-10 place-items-center rounded-lg bg-white text-ink shadow-sm ring-1 ring-slate-200"
            aria-label="이전 추천 보기"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scroll("next")}
            className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white shadow-sm"
            aria-label="다음 추천 보기"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        id="home-interest-carousel"
        className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
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
          )
        )}
      </div>
    </div>
  );
}

function OfficialGoodsSlide({ product }: { product: Product }) {
  const primaryOffer =
    product.offers.find((offer) => offer.isOfficial) ?? product.offers[0];

  const prices = product.offers
    .map((offer) => offer.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  const price = prices.length ? Math.min(...prices) : 0;
  const href = `/goods/${product.id}`;
  const mallName = primaryOffer?.mallName || product.brand || product.category;

  return (
    <Card className="relative flex min-w-[11.25rem] snap-start flex-col overflow-hidden p-0 sm:min-w-[12rem]">
      <Link href={href} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
          <SafeImage
            src={product.image}
            alt={product.title}
            kind="product"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-2.5">
          <div className="flex flex-wrap gap-1">
            <Badge tone="pink">공식몰</Badge>
          </div>

          <p className="line-clamp-2 text-xs font-black leading-5 text-ink">
            {product.title}
          </p>

          <p className="line-clamp-1 text-[11px] font-bold text-slate-500">
            {mallName || "판매처 확인"}
          </p>

          <p className="text-xs font-black text-[#ff5f8d]">
            {price > 0 ? formatPrice(price) : "가격 정보 없음"}
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
      className="block min-w-[11.25rem] snap-start sm:min-w-[12rem]"
    >
      <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:bg-pink-50">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
          <SafeImage
            src={market.image_url}
            alt={market.title}
            kind="product"
            className="h-full w-full object-cover transition hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-2.5">
          <div className="flex flex-wrap gap-1">
            <Badge tone="mint">유저거래</Badge>
            <Badge tone="gray">{tradeTypeLabel(market.trade_type)}</Badge>
          </div>

          <p className="line-clamp-2 text-xs font-black leading-5 text-ink">
            {market.title}
          </p>

          <p className="text-xs font-black text-[#ff5f8d]">
            {tradeValueLabel(market.trade_type, market.price)}
          </p>

          <p className="line-clamp-1 text-[11px] font-bold text-slate-500">
            {market.galleries?.name ?? "갤러리"}
          </p>
        </div>
      </Card>
    </Link>
  );
}