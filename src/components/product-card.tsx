import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductLikeButton } from "@/components/product-like-button";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/lib/format";
import { externalGoodsDetailHref } from "@/lib/goods-detail-link";
import type { Product } from "@/types/domain";

export function ProductCard({ product }: { product: Product }) {
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  const lowest = prices.length ? Math.min(...prices) : 0;
  const externalOffer = product.id.startsWith("naver-") ? product.offers[0] : null;
  const href = externalOffer
    ? externalGoodsDetailHref({
        title: product.title,
        image: product.image,
        mallName: externalOffer.mallName,
        price: externalOffer.price,
        url: externalOffer.url,
        category: product.category
      })
    : `/goods/${product.id}`;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(255,111,155,0.12)]">
      <Link href={href} aria-label={`${product.title} 상세 보기`} className="absolute inset-0 z-10" />
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <SafeImage src={product.image} alt={product.title} kind="product" className="h-full w-full object-contain p-3 transition group-hover:scale-[1.03]" />
        <div className="absolute right-3 top-3 z-20">
          <ProductLikeButton productId={product.id} initialCount={product.bookmarkCount} compact product={{ title: product.title, image: product.image, href, price: lowest, mallName: product.offers[0]?.mallName || product.brand || product.category }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <p className="line-clamp-2 text-sm font-black leading-5 text-[#2f2352] transition group-hover:text-[#ff6f9b]">{product.title}</p>
        <div className="flex flex-wrap gap-1.5">
          {product.isOfficialProduct && <Badge tone="mint">공식</Badge>}
          <Badge tone="gray">{product.brand || product.category}</Badge>
          {product.offers.some((offer) => offer.specialBenefit) && <Badge tone="sun">특전</Badge>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-sm font-black text-[#ff5f8d]">{prices.length ? formatPrice(lowest) : "가격 정보 없음"}</p>
          <span className="rounded-full bg-[#fbf4ff] px-2.5 py-1 text-[11px] font-black text-[#6f4ab4]">상세 보기</span>
        </div>
      </div>
    </Card>
  );
}
