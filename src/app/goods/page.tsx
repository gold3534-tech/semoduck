import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { products } from "@/lib/mock-data";

export default function GoodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">굿즈 탐색</p>
        <h1 className="mt-2 text-3xl font-black">판매처와 특전을 비교해요</h1>
      </div>
      <Card className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input className="min-h-11 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="쿠로미 키링, 포토카드 바인더..." />
        <div className="flex flex-wrap gap-2">
          {["인기순", "낮은 가격순", "최신순", "찜 많은 순", "공식", "중고"].map((filter, index) => (
            <Badge key={filter} tone={index === 0 ? "pink" : "gray"}>
              {filter}
            </Badge>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
