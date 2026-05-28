import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Heart, Package, ShieldCheck, Star, Truck } from "lucide-react";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductLikeButton } from "@/components/product-like-button";
import { RelatedPostList, type RelatedPostItem } from "@/components/related-post-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractPostKeywords } from "@/lib/ai";
import { formatPrice } from "@/lib/format";
import { extractRelevantTokens, sortByRelevance } from "@/lib/relevance";
import { createDataSupabaseClient } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExternalGoodsDetailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const title = firstValue(params.title) ?? "외부 굿즈";
  const image = firstValue(params.image) ?? "";
  const mallName = firstValue(params.mall) ?? "외부 판매처";
  const url = firstValue(params.url) ?? "";
  const category = firstValue(params.category) ?? "캐릭터굿즈";
  const price = Number(firstValue(params.price) ?? 0);
  const productKey = `external:${title}:${mallName}`;

  const supabase = createDataSupabaseClient();
  const aiPostKeywords = await extractPostKeywords(`${title}\n${category}\n${mallName}`);
  const relatedTerms = [...new Set([...aiPostKeywords.post_keywords, ...extractRelevantTokens([title, category], 10)])].slice(0, 10);
  const relatedFilters = relatedTerms.flatMap((term) => [`title.ilike.%${term}%`, `content.ilike.%${term}%`]);
  const { data: relatedPostRows } = relatedFilters.length
    ? await supabase
        .from("posts")
        .select("id,title,content,post_type,like_count,comment_count,image_url,galleries(name,slug)")
        .or(relatedFilters.join(","))
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };
  const relatedPosts = sortByRelevance(
    (relatedPostRows ?? []) as RelatedPostItem[],
    relatedTerms,
    (post) => [post.title, post.content, post.galleries?.name, post.galleries?.slug],
    (post) => Number(post.like_count ?? 0) + Number(post.comment_count ?? 0),
    25
  ).slice(0, 6);

  return (
    <div className="space-y-3">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/">홈</Link>
        <span>&gt;</span>
        <Link href="/goods">굿즈검색</Link>
        <span>&gt;</span>
        <span>{category}</span>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-3">
          <Card className="p-4">
            <div className="relative">
              <ProductImageGallery images={[image].filter(Boolean)} title={title} />
              <div className="absolute left-3 top-3"><Badge tone="pink">외부 상품</Badge></div>
              <div className="absolute right-3 top-3"><ProductLikeButton productId={productKey} initialCount={312} compact /></div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-1.5"><Badge tone="mint">네이버</Badge><Badge tone="violet">{mallName}</Badge><Badge>{category}</Badge></div>
              <h1 className="text-3xl font-black leading-tight text-[#3a285f] md:text-4xl">{title}</h1>
              <p className="text-2xl font-black text-[#ff5f8d]">{formatPrice(price)}</p>
              <p className="text-sm font-bold leading-7 text-slate-600">외부 검색 결과를 바탕으로 정리한 굿즈 상세 페이지입니다. 구매 전 판매처, 가격, 배송비, 정품 여부를 확인해 주세요.</p>

              <div className="rounded-2xl border border-[#efd7e7] bg-[#fbf4ff] p-3">
                <div className="flex items-center gap-3">
                  <Image src="/semoduck-profile-duck.png" alt="" width={64} height={64} className="rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-[#3a285f]">{mallName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">판매처 페이지에서 가격, 옵션, 배송 정보를 최종 확인하세요.</p>
                  </div>
                </div>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#6f4ab4] px-4 text-sm font-black text-white">
                    구매 사이트로 이동 <ExternalLink size={15} />
                  </a>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="grid gap-4 p-4 md:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><Star size={18} className="text-[#f8b83e]" /> 상품 정보</h2>
              <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
                <div className="grid grid-cols-[6rem_1fr]"><dt className="text-[#6f4ab4]">판매처</dt><dd>{mallName}</dd></div>
                <div className="grid grid-cols-[6rem_1fr]"><dt className="text-[#6f4ab4]">가격</dt><dd>{price > 0 ? formatPrice(price) : "판매처 확인"}</dd></div>
                <div className="grid grid-cols-[6rem_1fr]"><dt className="text-[#6f4ab4]">재고 여부</dt><dd className="text-emerald-600">판매처 확인</dd></div>
              </dl>
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><Package size={18} /> 분류</h2>
              <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
                <div className="grid grid-cols-[6rem_1fr]"><dt className="text-[#6f4ab4]">카테고리</dt><dd>{category}</dd></div>
                <div className="grid grid-cols-[6rem_1fr]"><dt className="text-[#6f4ab4]">출처</dt><dd>외부 검색</dd></div>
                <div className="grid grid-cols-[6rem_1fr]"><dt className="text-[#6f4ab4]">거래 방식</dt><dd>외부 사이트 이동</dd></div>
              </dl>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><Heart size={18} className="text-[#ff6f9b]" /> 상품 소개</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-600">{title} 관련 판매 링크입니다. 세모덕에서는 구매 경험, 정품 정보, 후기 게시글을 함께 볼 수 있도록 관련 이야기를 모아 보여줍니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs"><ShieldCheck size={14} /> 판매처 확인</Button>
              <Button variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs"><Truck size={14} /> 배송 확인</Button>
            </div>
          </Card>
        </div>

        <RelatedPostList title="이 굿즈 이야기" posts={relatedPosts} />
      </div>
    </div>
  );
}
