import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageCircle } from "lucide-react";
import { ReportButton } from "@/components/report-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, postTypeLabel, sourceLabel } from "@/lib/format";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

function isPriceCompareOffer(offer: { mall_name: string; url: string }) {
  return offer.mall_name === "네이버" || /search\.shopping\.naver\.com\/catalog/i.test(offer.url);
}

export default async function GoodsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const { data: product } = await supabase
    .from("products")
    .select("id,title,brand,category,description,image_url,is_official_product,product_offers(id,source,mall_name,price,shipping_fee,is_official,is_used,special_benefit,url)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const offers = (product.product_offers ?? [])
    .filter((offer: any) => !isPriceCompareOffer(offer))
    .sort((a: any, b: any) => Number(b.is_official) - Number(a.is_official) || Number(a.is_used) - Number(b.is_used) || Number(a.price || 0) - Number(b.price || 0));
  const relatedTerms = [...new Set([product.title, product.brand, product.category].filter(Boolean) as string[])].slice(0, 4);
  const relatedFilters = relatedTerms.flatMap((term) => [`title.ilike.%${term}%`, `content.ilike.%${term}%`]);
  const { data: relatedPosts } = relatedFilters.length
    ? await supabase
        .from("posts")
        .select("id,title,content,post_type,like_count,comment_count,created_at,profiles(nickname,email)")
        .or(relatedFilters.join(","))
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };

  return (
    <div className="grid gap-6 lg:grid-cols-[25rem_1fr]">
      <Card className="h-fit overflow-hidden p-0">
        <div className="relative aspect-square overflow-hidden bg-[#f7f2fb]">
          {product.image_url ? <Image src={product.image_url} alt={product.title} fill className="object-cover" sizes="400px" /> : null}
        </div>
        <div className="p-5 flex flex-wrap gap-2">
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
          <h1 className="mt-3 text-4xl font-black text-[#3a285f]">{product.title}</h1>
          <p className="mt-3 font-bold leading-7 text-slate-600">{product.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ReportButton targetType="product" targetId={id} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">판매 링크</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {offers.map((offer: any) => (
              <div key={offer.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{offer.mall_name}</p>
                    <Badge tone={offer.is_official ? "mint" : "gray"}>{sourceLabel(offer.source)}</Badge>
                    {offer.is_used && <Badge tone="sun">중고</Badge>}
                    {offer.special_benefit && <Badge tone="pink">{offer.special_benefit}</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500">배송비 {offer.shipping_fee > 0 ? formatPrice(offer.shipping_fee) : "확인 필요"}</p>
                </div>
                <a href={offer.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#3a285f] px-4 text-sm font-black text-white">
                  {offer.price > 0 ? formatPrice(offer.price) : "가격 확인"}
                  <ExternalLink size={15} />
                </a>
              </div>
            ))}
            {!offers.length && <p className="py-4 text-sm font-bold text-slate-500">아직 등록된 판매 링크가 없습니다.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><MessageCircle size={20} /> 비슷한 게시물</h2>
          <div className="mt-4 space-y-3">
            {(relatedPosts ?? []).map((post: any) => {
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              return (
                <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-2xl bg-[#fbf4ff] p-4 transition hover:bg-[#fff5fa]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge>
                    <span className="text-xs font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"}</span>
                    <span className="text-xs font-bold text-slate-400">{formatDateTime(post.created_at)}</span>
                  </div>
                  <p className="mt-2 font-black">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">좋아요 {post.like_count} · 댓글 {post.comment_count}</p>
                </Link>
              );
            })}
            {!(relatedPosts ?? []).length && <p className="rounded-lg bg-cloud p-4 text-sm font-bold text-slate-500">아직 연결된 게시물이 없습니다.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
