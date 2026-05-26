import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MessageCircle, ShoppingCart } from "lucide-react";
import { CommentActions } from "@/app/posts/[id]/comment-actions";
import { CommentForm } from "@/app/posts/[id]/comment-form";
import { PostActions } from "@/app/posts/[id]/post-actions";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { extractProductKeywords } from "@/lib/ai";
import { formatDateTime, formatPrice, postTypeLabel } from "@/lib/format";
import { fallbackRecommendedProducts, fallbackTags, keywordsForPost, productFromDbRow, productSelect, relatedProducts } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

export const dynamic = "force-dynamic";

function productPrice(product: Product) {
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = userData.user?.id ?? null;
  const isAdmin = isAdminEmail(userData.user?.email);
  const [{ data: post }, { data: comments }, { data: tagRows }] = await Promise.all([
    supabase.from("posts").select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,user_id,image_url,profiles(id,nickname,email),galleries(name,slug,category)").eq("id", id).eq("is_deleted", false).single(),
    supabase.from("comments").select("id,content,like_count,created_at,user_id,profiles(id,nickname,email)").eq("post_id", id).eq("is_deleted", false).order("created_at", { ascending: true }),
    supabase.from("post_tags").select("tags(name)").eq("post_id", id)
  ]);
  if (!post) notFound();
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const gallery = Array.isArray(post.galleries) ? post.galleries[0] : post.galleries;
  const dbTags = ((tagRows ?? []) as Array<{ tags?: { name?: string } | Array<{ name?: string }> | null }>).map((row) => Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name).filter(Boolean) as string[];
  const tags = dbTags.length ? dbTags : fallbackTags({ title: post.title, content: post.content, gallerySlug: gallery?.slug, galleryName: gallery?.name });
  const aiKeywords = await extractProductKeywords(`${post.title}\n${post.content}\n${tags.join(", ")}\n${gallery?.name ?? ""}`);
  const keywords = [
    ...aiKeywords.product_keywords,
    ...keywordsForPost({ title: post.title, content: post.content, gallerySlug: gallery?.slug, galleryName: gallery?.name, tags })
  ];
  const productFilters = [...new Set(keywords)]
    .filter(Boolean)
    .slice(0, 8)
    .flatMap((term) => [`title.ilike.%${term}%`, `brand.ilike.%${term}%`, `category.ilike.%${term}%`, `description.ilike.%${term}%`]);
  const { data: relatedProductRows } = productFilters.length
    ? await supabase.from("products").select(productSelect).or(productFilters.join(",")).eq("is_deleted", false).limit(40)
    : { data: [] };
  const localRelatedProducts = relatedProducts((relatedProductRows ?? []).map(productFromDbRow), [...new Set(keywords)], 4);
  const goods = localRelatedProducts.length ? localRelatedProducts : fallbackRecommendedProducts(keywords, 4);
  const isOwner = currentUserId === post.user_id;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <article className="space-y-4">
        <Card className="overflow-hidden rounded-[1.5rem] border-[#efd7e7] bg-gradient-to-br from-white via-[#fffafd] to-[#fff6fb] p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge>
            <span className="text-xs font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"}</span>
            <span className="text-xs font-bold text-slate-400">{formatDateTime(post.created_at)}</span>
          </div>
          <h1 className="text-2xl font-black leading-tight text-[#3a285f] md:text-3xl">{post.title}</h1>
          <p className="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-slate-700">{post.content}</p>
          <div className="mt-3 flex flex-wrap gap-2">{(tags.length ? tags : ["세모덕"]).map((tag) => <Badge key={tag}>#{tag}</Badge>)}</div>
          {post.image_url ? (
            <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-[1.25rem] bg-[#f7f2fb] ring-1 ring-[#efd7e7]">
              <SafeImage src={post.image_url} alt="" kind="product" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <PostActions postId={post.id} initialLikes={post.like_count} initialBookmarks={post.bookmark_count} initialLiked={false} initialBookmarked={false} isOwner={isOwner} isAdmin={isAdmin} />
        </Card>

        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]"><MessageCircle size={18} /> 댓글 {comments?.length ?? 0}</h2>
          <div className="mt-3 space-y-2">
            {(comments ?? []).map((comment) => {
              const writer = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
              const isCommentOwner = currentUserId === comment.user_id;
              const canDeleteComment = isCommentOwner || isAdmin;
              return (
                <div key={comment.id} className="relative rounded-2xl bg-[#fff7fb] p-3 pr-20 ring-1 ring-[#f2deeb]">
                  {canDeleteComment && <CommentActions commentId={comment.id} initialContent={comment.content} canEdit={isCommentOwner} />}
                  <p className="text-sm font-black">{writer?.nickname ?? writer?.email ?? "회원"}</p>
                  <p className="mt-1 text-sm text-slate-700">{comment.content}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{formatDateTime(comment.created_at)}</p>
                </div>
              );
            })}
            {!(comments ?? []).length && <p className="rounded-2xl bg-[#fff7fb] p-3 text-sm font-bold text-slate-500">아직 댓글이 없습니다.</p>}
          </div>
          <CommentForm postId={post.id} />
        </Card>
      </article>

      <aside className="space-y-3">
        <div>
          <p className="text-sm font-black text-[#ff6f9b]">이 글과 함께 볼 굿즈</p>
          <h2 className="text-xl font-black text-[#3a285f]">관련 굿즈</h2>
        </div>
        <div className="grid gap-3">
          {goods.map((product) => {
            const offer = product.offers.find((item) => item.isOfficial) ?? product.offers[0];
            const price = productPrice(product);
            return (
              <Card key={product.id} className="grid grid-cols-[5.5rem_1fr] gap-3 p-3">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
                  <SafeImage src={product.image} alt="" kind="product" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <Badge tone="pink">{product.isOfficialProduct ? "인기" : product.category}</Badge>
                  <p className="mt-2 line-clamp-2 text-sm font-black text-[#2f2352]">{product.title}</p>
                  <p className="mt-2 text-sm font-black text-[#ff5f8d]">{formatPrice(price)}</p>
                  <Link href={offer?.url ?? `/goods/${product.id}`} target={offer?.url ? "_blank" : undefined} className="mt-2 inline-flex h-8 items-center gap-1 rounded-full bg-[#3a285f] px-3 text-xs font-black text-white">
                    <ShoppingCart size={13} /> 링크 <ExternalLink size={12} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
