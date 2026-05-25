import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  const primaryOffer = product.offers.find((offer) => offer.isOfficial) ?? product.offers[0];

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(255,111,155,0.12)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f7f2fb]">
        {product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 260px" /> : null}
        <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#ff6f9b] ring-1 ring-[#f4dbe7]">♡</div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <Link href={href} className="line-clamp-2 text-sm font-black leading-5 text-[#2f2352] hover:text-[#ff6f9b]">
          {product.title}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {product.isOfficialProduct && <Badge tone="mint">공식</Badge>}
          <Badge tone="gray">{product.brand || product.category}</Badge>
          {product.offers.some((offer) => offer.specialBenefit) && <Badge tone="sun">특전</Badge>}
        </div>
        <p className="mt-auto text-sm font-black text-[#ff5f8d]">{prices.length ? formatPrice(lowest) : "가격 확인 필요"}</p>
        <Link href={primaryOffer?.url ?? href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-xl bg-[#3a285f] px-3 py-1 text-xs font-black text-white">
          {primaryOffer?.isOfficial ? "공식 판매처" : "판매 링크"}
          <ExternalLink size={13} />
        </Link>
      </div>
    </Card>
  );
}
