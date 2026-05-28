import Link from "next/link";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { RelatedSideItem } from "@/lib/related-side-items";

export function RelatedSideCard({ item }: { item: RelatedSideItem }) {
  const isExternal = item.kind === "naver";

  const badgeTone =
    item.kind === "market" ? "mint" : item.kind === "product" ? "pink" : "gray";

  const card = (
    <Card className="grid grid-cols-[5.25rem_1fr] gap-3 rounded-2xl border-[#f1dbe8] bg-white/88 p-3 transition hover:bg-[#fff5fa]">
      <div className="relative h-20 overflow-hidden rounded-xl bg-[#f7f2fb]">
        <SafeImage
          src={item.image}
          alt={item.title}
          kind="product"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <Badge tone={badgeTone}>{item.label}</Badge>
        </div>

        <p className="line-clamp-2 text-sm font-black leading-5 text-[#2f2352]">
          {item.title}
        </p>

        <p className="mt-1 text-sm font-black text-[#ff5f8d]">
          {item.price > 0 ? formatPrice(item.price) : "가격 정보 없음"}
        </p>

        {item.reason ? (
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-400">
            {item.reason}
          </p>
        ) : null}

        <div className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-[#3f2a63] px-3 text-xs font-black text-white">
          <ShoppingBag size={13} />
          정보 보기
          {isExternal ? <ExternalLink size={12} /> : null}
        </div>
      </div>
    </Card>
  );

  if (isExternal) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );
  }

  return <Link href={item.href}>{card}</Link>;
}