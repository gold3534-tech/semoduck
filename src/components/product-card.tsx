import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/domain";

export function ProductCard({ product }: { product: Product }) {
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  const lowest = prices.length ? Math.min(...prices) : 0;
  const externalUrl = product.id.startsWith("naver-") ? product.offers[0]?.url : null;
  const href = externalUrl ?? `/goods/${product.id}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
        {product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={href} target={externalUrl ? "_blank" : undefined} rel={externalUrl ? "noopener noreferrer" : undefined} className="line-clamp-2 font-black text-ink hover:text-berry">
          {product.title}
        </Link>
        <div className="flex flex-wrap gap-2">
          {product.isOfficialProduct && <Badge tone="mint">공식</Badge>}
          <Badge tone="gray">{product.brand || product.category}</Badge>
          {product.offers.some((offer) => offer.specialBenefit) && <Badge tone="sun">특전</Badge>}
        </div>
        <p className="mt-auto text-lg font-black">{prices.length ? formatPrice(lowest) : "가격 확인 필요"}</p>
        <Link href={href} target={externalUrl ? "_blank" : undefined} rel={externalUrl ? "noopener noreferrer" : undefined} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">
          판매 링크 열기
          <ExternalLink size={15} />
        </Link>
      </div>
    </Card>
  );
}
