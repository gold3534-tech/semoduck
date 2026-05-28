"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ProductLikeButton } from "@/components/product-like-button";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/domain";

function productPrice(product: Product) {
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function HomeProductCarousel({ products }: { products: Product[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="이전 추천 굿즈"
        className="absolute left-1 top-[42%] z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-[#6f4ab4] shadow-soft ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7] 2xl:h-10 2xl:w-10"
      >
        <ChevronLeft size={18} />
      </button>
      <div ref={scrollerRef} className="flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] 2xl:gap-4 [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const price = productPrice(product);

          return (
            <Link key={product.id} href={`/goods/${product.id}`} className="min-w-[calc((100%_-_1.5rem)/3)] max-w-[calc((100%_-_1.5rem)/3)] snap-start 2xl:min-w-[calc((100%_-_2rem)/3)] 2xl:max-w-[calc((100%_-_2rem)/3)]">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                <SafeImage src={product.image} alt="" kind="product" className="h-full w-full object-contain p-2" />
                <div className="absolute right-3 top-3 z-20">
                  <ProductLikeButton productId={product.id} initialCount={product.bookmarkCount} compact product={{ title: product.title, image: product.image, href: `/goods/${product.id}`, price, mallName: product.offers[0]?.mallName || product.brand || product.category }} />
                </div>
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-5 text-[#2f2352] 2xl:text-base 2xl:leading-6">{product.title}</p>
              <p className="line-clamp-1 text-[11px] font-bold text-slate-500">{product.offers[0]?.mallName || product.brand || product.category}</p>
              <p className="text-sm font-black text-[#ff5f8d] 2xl:text-base">{formatPrice(price)}</p>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="다음 추천 굿즈"
        className="absolute right-1 top-[42%] z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-[#6f4ab4] shadow-soft ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7] 2xl:h-10 2xl:w-10"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
