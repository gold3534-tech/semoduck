import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Heart, Package, ShieldCheck, Star, Truck } from "lucide-react";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductLikeButton } from "@/components/product-like-button";
import { RelatedPostList, type RelatedPostItem } from "@/components/related-post-list";
import { ReportButton } from "@/components/report-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, sourceLabel } from "@/lib/format";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

function isPriceCompareOffer(offer: { mall_name: string; url: string }) {
  return offer.mall_name === "네이버" || /search\.shopping\.naver\.com\/catalog/i.test(offer.url);
}

function detailTerms(product: { title: string; brand?: string | null; category?: string | null; description?: string | null }) {
  return [...new Set([product.title, product.brand, product.category, ...(product.description ?? "").split(/\s+/).slice(0, 4)].filter(Boolean) as string[])].slice(0, 6);
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
  const primaryOffer = offers[0];
  const displayPrice = primaryOffer?.price ? formatPrice(primaryOffer.price) : "가격 확인 필요";
  const images = [product.image_url].filter(Boolean) as string[];
  const relatedTerms = detailTerms(product);
  const relatedFilters = relatedTerms.flatMap((term) => [`title.ilike.%${term}%`, `content.ilike.%${term}%`]);
  const { data: relatedPosts } = relatedFilters.length
    ? await supabase
        .from("posts")
        .select("id,title,content,post_type,like_count,comment_count,image_url,galleries(name,slug)")
        .or(relatedFilters.join(","))
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };

  return (
    <div className="space-y-3">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/">홈</Link>
        <span>&gt;</span>
        <Link href="/goods">굿즈검색</Link>
        <span>&gt;</span>
        <span>{product.category}</span>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-3">
          <Card className="p-4">
            <div className="relative">
              <ProductImageGallery images={images} title={product.title} />
              <div className="absolute left-3 top-3">
                <Badge tone={product.is_official_product ? "violet" : "pink"}>{product.is_official_product ? "공식" : "상품"}</Badge>
              </div>
              <div className="absolute right-3 top-3">
                <ProductLikeButton productId={id} initialCount={312} compact />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="mint">{product.category}</Badge>
                {product.brand ? <Badge>{product.brand}</Badge> : null}
                {primaryOffer?.is_official ? <Badge tone="pink">인증 판매처</Badge> : null}
              </div>
              <h1 className="text-3xl font-black leading-tight text-[#3a285f] md:text-4xl">{product.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
                <span className="text-[#f8b83e]">★★★★★</span>
                <span>4.9</span>
                <span>찜 312</span>
              </div>
              <p className="text-2xl font-black text-[#ff5f8d]">{displayPrice}</p>
              <p className="text-sm font-bold leading-7 text-slate-600">{product.description || `${product.title}의 판매 링크와 관련 게시글을 함께 확인해 보세요.`}</p>

              {primaryOffer ? (
                <div className="rounded-2xl border border-[#efd7e7] bg-[#fbf4ff] p-3">
                  <div className="flex items-center gap-3">
                    <Image src="/semoduck-profile-duck.png" alt="" width={64} height={64} className="rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#3a285f]">{primaryOffer.mall_name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {sourceLabel(primaryOffer.source)} · {primaryOffer.is_official ? "공식 판매처" : "외부 판매 링크"}
                      </p>
                    </div>
                  </div>
                  <a href={primaryOffer.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#6f4ab4] px-4 text-sm font-black text-white">
                    구매 사이트로 이동 <ExternalLink size={15} />
                  </a>
                </div>
              ) : null}

              <ReportButton targetType="product" targetId={id} />
            </div>
          </Card>

          <Card className="grid gap-4 p-4 md:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]">
                <Star size={18} className="text-[#f8b83e]" /> 상품 정보
              </h2>
              <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
                <div className="grid grid-cols-[6rem_1fr]">
                  <dt className="text-[#6f4ab4]">판매처</dt>
                  <dd>{primaryOffer?.mall_name ?? "확인 필요"}</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr]">
                  <dt className="text-[#6f4ab4]">배송</dt>
                  <dd>{primaryOffer?.shipping_fee ? `배송비 ${formatPrice(primaryOffer.shipping_fee)}` : "판매처 확인"}</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr]">
                  <dt className="text-[#6f4ab4]">재고 여부</dt>
                  <dd className="text-emerald-600">판매처 확인</dd>
                </div>
              </dl>
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]">
                <Package size={18} /> 분류
              </h2>
              <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
                <div className="grid grid-cols-[6rem_1fr]">
                  <dt className="text-[#6f4ab4]">카테고리</dt>
                  <dd>{product.category}</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr]">
                  <dt className="text-[#6f4ab4]">캐릭터</dt>
                  <dd>{product.brand || "미분류"}</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr]">
                  <dt className="text-[#6f4ab4]">상태</dt>
                  <dd>{product.is_official_product ? "공식 상품" : "외부 판매 상품"}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]">
              <Heart size={18} className="text-[#ff6f9b]" /> 상품 소개
            </h2>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-600">{product.description || "굿즈의 상세 설명은 판매처에서 확인할 수 있습니다. 세모덕에서는 관련 게시글과 판매 링크를 함께 모아 보여줍니다."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs">
                <ShieldCheck size={14} /> 판매처 확인
              </Button>
              <Button variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs">
                <Truck size={14} /> 배송 확인
              </Button>
            </div>
          </Card>
        </div>

        <RelatedPostList title="이 굿즈 이야기" posts={(relatedPosts ?? []) as RelatedPostItem[]} />
      </div>
    </div>
  );
}
