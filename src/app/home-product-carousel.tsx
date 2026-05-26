"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useRef } from "react";
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
      left: direction === "left" ? -360 : 360,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="이전 추천 굿즈"
        className="absolute -left-1 top-8 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-[#6f4ab4] shadow-soft ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7] 2xl:top-11 2xl:h-9 2xl:w-9 min-[1800px]:top-14"
      >
        <ChevronLeft size={18} />
      </button>
      <div ref={scrollerRef} className="flex snap-x gap-2 overflow-x-auto scroll-smooth px-3 pb-1 [scrollbar-width:none] 2xl:gap-3 min-[1800px]:gap-4 [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const price = productPrice(product);

          return (
            <Link key={product.id} href={`/goods/${product.id}`} className="min-w-[3.55rem] max-w-[3.55rem] snap-start sm:min-w-[3.75rem] sm:max-w-[3.75rem] 2xl:min-w-[5.25rem] 2xl:max-w-[5.25rem] min-[1800px]:min-w-[6.5rem] min-[1800px]:max-w-[6.5rem] min-[2200px]:min-w-[7.5rem] min-[2200px]:max-w-[7.5rem]">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
                {product.image ? <Image src={product.image} alt="" fill className="object-cover" sizes="(min-width: 2200px) 120px, (min-width: 1800px) 104px, (min-width: 1536px) 84px, 64px" /> : <Package className="m-auto mt-6 text-[#b89dde]" />}
              </div>
              <p className="mt-1 line-clamp-2 min-h-8 text-[11px] font-black leading-4 text-[#2f2352] 2xl:min-h-10 2xl:text-xs 2xl:leading-5 min-[1800px]:text-sm min-[1800px]:leading-5">{product.title}</p>
              <p className="text-[11px] font-black text-[#ff5f8d] 2xl:text-xs min-[1800px]:text-sm">{price ? formatPrice(price) : "가격 확인"}</p>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="다음 추천 굿즈"
        className="absolute -right-1 top-8 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-[#6f4ab4] shadow-soft ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7] 2xl:top-11 2xl:h-9 2xl:w-9 min-[1800px]:top-14"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
