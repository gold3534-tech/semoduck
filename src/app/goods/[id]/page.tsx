import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, sourceLabel } from "@/lib/format";
import { posts, products } from "@/lib/mock-data";

export default async function GoodsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  if (!product) notFound();

  const relatedPosts = posts.filter((post) => product.tags.some((tag) => post.tags.includes(tag)));

  return (
    <div className="grid gap-6 lg:grid-cols-[25rem_1fr]">
      <Card className="h-fit">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
          <Image src={product.image} alt={product.title} fill className="object-cover" sizes="400px" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      </Card>
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge tone="mint">{product.category}</Badge>
            {product.isOfficialProduct && <Badge tone="pink">공식 상품</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-black">{product.title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{product.description}</p>
          <Button className="mt-5" variant="secondary">
            <Heart size={16} /> 찜하기 {product.bookmarkCount}
          </Button>
        </Card>
        <Card>
          <h2 className="text-xl font-black">판매처별 가격</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {product.offers.map((offer) => (
              <div key={offer.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{offer.mallName}</p>
                    <Badge tone={offer.isOfficial ? "mint" : "gray"}>{sourceLabel(offer.source)}</Badge>
                    {offer.isUsed && <Badge tone="sun">중고</Badge>}
                    {offer.specialBenefit && <Badge tone="pink">{offer.specialBenefit}</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">배송비 {formatPrice(offer.shippingFee)}</p>
                </div>
                <a href={offer.url} target={offer.url.startsWith("/") ? "_self" : "_blank"} rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white">
                  {formatPrice(offer.price)}
                  <ExternalLink size={15} />
                </a>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">관련 게시글</h2>
          <div className="mt-3 space-y-2">
            {relatedPosts.map((post) => (
              <a key={post.id} href={`/posts/${post.id}`} className="block rounded-lg bg-cloud p-3 font-bold text-slate-700 hover:text-berry">
                {post.title}
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
