import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { galleries, marketItems } from "@/lib/mock-data";

const tradeLabels = {
  sell: "판매",
  exchange: "교환",
  transfer: "양도",
  giveaway: "나눔"
};

const statusLabels = {
  active: "거래 가능",
  reserved: "예약중",
  completed: "거래완료",
  hidden: "숨김",
  reported: "신고됨"
};

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">교환/양도/중고</p>
        <h1 className="mt-2 text-3xl font-black">세모덕 자체 마켓 게시판</h1>
        <p className="mt-3 text-slate-600">실제 결제와 배송은 제공하지 않고, 포트폴리오용 게시판과 댓글 문의 흐름만 구현합니다.</p>
      </div>
      <Card className="flex flex-wrap gap-2">
        {["전체", "판매", "교환", "양도", "나눔", "판매중", "예약중"].map((filter, index) => (
          <Badge key={filter} tone={index === 0 ? "pink" : "gray"}>
            {filter}
          </Badge>
        ))}
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketItems.map((item) => {
          const gallery = galleries.find((entry) => entry.slug === item.gallerySlug);
          return (
            <Card key={item.id} className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="mint">{tradeLabels[item.tradeType]}</Badge>
                  <Badge tone={item.status === "active" ? "pink" : "sun"}>{statusLabels[item.status]}</Badge>
                </div>
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="text-2xl font-black">{formatPrice(item.price)}</p>
                <p className="text-sm font-bold text-slate-500">{gallery?.name} · {item.region} · {item.author}</p>
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1">
                    <Heart size={16} /> 찜
                  </Button>
                  <Button className="flex-1">
                    <MessageCircle size={16} /> 문의
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
