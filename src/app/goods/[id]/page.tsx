import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, postTypeLabel, sourceLabel } from "@/lib/format";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function GoodsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const { data: product } = await admin
    .from("products")
    .select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const { data: relatedPosts } = await admin
    .from("posts")
    .select("id,title,post_type,created_at,galleries(name,slug)")
    .eq("is_deleted", false)
    .or(`title.ilike.%${product.title.slice(0, 12)}%,content.ilike.%${product.category}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  const offers = (product.product_offers ?? []) as Array<{
    id: string;
    source: string;
    mall_name: string;
    price: number;
    shipping_fee: number;
    condition: string;
    is_official: boolean;
    is_used: boolean;
    special_benefit?: string | null;
    url: string;
  }>;

  return (
    <div className="grid gap-6 lg:grid-cols-[25rem_1fr]">
      <Card className="h-fit">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
          {product.image_url ? <Image src={product.image_url} alt={product.title} fill className="object-cover" sizes="400px" /> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>#{product.category}</Badge>
          {product.brand ? <Badge>#{product.brand}</Badge> : null}
        </div>
      </Card>
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge tone="mint">{product.category}</Badge>
            {product.is_official_product && <Badge tone="pink">공식 상품</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-black">{product.title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{product.description}</p>
          <Button className="mt-5" variant="secondary">
            <Heart size={16} /> 찜하기 {product.bookmark_count ?? 0}
          </Button>
        </Card>
        <Card>
          <h2 className="text-xl font-black">판매처별 가격</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {offers.map((offer) => (
              <div key={offer.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{offer.mall_name}</p>
                    <Badge tone={offer.is_official ? "mint" : "gray"}>{sourceLabel(offer.source)}</Badge>
                    {offer.is_used && <Badge tone="sun">중고</Badge>}
                    {offer.special_benefit && <Badge tone="pink">{offer.special_benefit}</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">배송비 {formatPrice(offer.shipping_fee)}</p>
                </div>
                <a href={offer.url} target={offer.url.startsWith("/") ? "_self" : "_blank"} rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white">
                  {formatPrice(offer.price)}
                  <ExternalLink size={15} />
                </a>
              </div>
            ))}
            {!offers.length && <p className="py-4 text-sm font-bold text-slate-500">아직 등록된 판매처가 없습니다.</p>}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">관련 게시글</h2>
          <div className="mt-3 space-y-2">
            {(relatedPosts ?? []).map((post) => {
              const gallery = Array.isArray(post.galleries) ? post.galleries[0] : post.galleries;
              return (
                <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-lg bg-cloud p-3 font-bold text-slate-700 hover:text-berry">
                  <span className="mr-2 text-xs text-berry">{postTypeLabel(post.post_type)}</span>
                  {post.title}
                  <span className="ml-2 text-xs text-slate-400">{gallery?.name} · {formatDateTime(post.created_at)}</span>
                </Link>
              );
            })}
            {!(relatedPosts ?? []).length && <p className="rounded-lg bg-cloud p-3 text-sm font-bold text-slate-500">관련 게시글이 없습니다.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
