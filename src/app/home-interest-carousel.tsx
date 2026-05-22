"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBag } from "lucide-react";
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

export function HomeInterestCarousel({ items, interests }: { items: HomeInterestItem[]; interests: string[] }) {
  function scroll(direction: "prev" | "next") {
    const element = document.getElementById("home-interest-carousel");
    if (!element) return;
    element.scrollBy({ left: direction === "next" ? 360 : -360, behavior: "smooth" });
  }

  if (!items.length) {
    return <Card>관심사와 맞는 공식 굿즈나 유저거래가 아직 없습니다.</Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black text-berry">내 관심사 기반</p>
          <h2 className="text-2xl font-black">공식 굿즈와 유저거래</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {interests.length ? interests.map((interest) => `#${interest}`).join(" ") : "인기 관심사"} 기준으로 보여줍니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll("prev")} className="grid h-10 w-10 place-items-center rounded-lg bg-white text-ink shadow-sm ring-1 ring-slate-200">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll("next")} className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white shadow-sm">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div id="home-interest-carousel" className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {items.map((item) =>
          item.kind === "official" ? (
            <OfficialGoodsSlide key={`official-${item.product.id}`} product={item.product} />
          ) : (
            <MarketSlide key={`market-${item.market.id}`} market={item.market} />
          )
        )}
      </div>
    </div>
  );
}

function OfficialGoodsSlide({ product }: { product: Product }) {
  const primaryOffer = product.offers.find((offer) => offer.isOfficial) ?? product.offers[0];
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  const price = prices.length ? Math.min(...prices) : 0;

  return (
    <Card className="flex min-w-[17.5rem] snap-start flex-col overflow-hidden p-0 sm:min-w-[20rem]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
        {product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="320px" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="mint">공식 굿즈</Badge>
          <Badge tone="gray">{product.brand || product.category}</Badge>
        </div>
        <p className="line-clamp-2 font-black text-ink">{product.title}</p>
        <p className="mt-auto text-lg font-black">{price ? formatPrice(price) : "가격 확인 필요"}</p>
        <Link href={primaryOffer?.url ?? `/goods/${product.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-white">
          공식 판매처 열기
          <ExternalLink size={15} />
        </Link>
      </div>
    </Card>
  );
}

function MarketSlide({ market }: { market: MarketPreview }) {
  return (
    <Link href={`/market/${market.id}`} className="block min-w-[17.5rem] snap-start sm:min-w-[20rem]">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:bg-pink-50">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
          {market.image_url ? <Image src={market.image_url} alt={market.title} fill className="object-cover" sizes="320px" /> : <div className="grid h-full place-items-center text-slate-300"><ShoppingBag size={36} /></div>}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="pink">유저거래</Badge>
            <Badge tone="mint">{tradeTypeLabel(market.trade_type)}</Badge>
          </div>
          <p className="line-clamp-2 font-black text-ink">{market.title}</p>
          <p className="mt-auto text-lg font-black">{tradeValueLabel(market.trade_type, market.price)}</p>
          <p className="text-sm font-bold text-slate-500">{market.galleries?.name ?? "갤러리"}</p>
        </div>
      </Card>
    </Link>
  );
}
