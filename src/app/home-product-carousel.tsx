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
      left: direction === "left" ? -260 : 260,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="이전 추천 굿즈"
        className="absolute -left-1 top-8 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-[#6f4ab4] shadow-soft ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7]"
      >
        <ChevronLeft size={18} />
      </button>
      <div ref={scrollerRef} className="flex snap-x gap-2 overflow-x-auto scroll-smooth px-8 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const price = productPrice(product);

          return (
            <Link key={product.id} href={`/goods/${product.id}`} className="min-w-[5.4rem] max-w-[5.4rem] snap-start">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
                {product.image ? <Image src={product.image} alt="" fill className="object-cover" sizes="96px" /> : <Package className="m-auto mt-6 text-[#b89dde]" />}
              </div>
              <p className="mt-1 line-clamp-2 min-h-8 text-[11px] font-black leading-4 text-[#2f2352]">{product.title}</p>
              <p className="text-[11px] font-black text-[#ff5f8d]">{price ? formatPrice(price) : "가격 확인"}</p>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="다음 추천 굿즈"
        className="absolute -right-1 top-8 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-[#6f4ab4] shadow-soft ring-1 ring-[#ead8f4] transition hover:bg-[#fff1f7]"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
