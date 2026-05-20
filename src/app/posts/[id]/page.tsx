import Image from "next/image";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { CommentActions } from "@/app/posts/[id]/comment-actions";
import { CommentForm } from "@/app/posts/[id]/comment-form";
import { PostActions } from "@/app/posts/[id]/post-actions";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import { fallbackRecommendedProducts, fallbackTags, keywordsForPost, productFromDbRow, productSelect, relatedProducts } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = userData.user?.id ?? null;
  const isAdmin = isAdminEmail(userData.user?.email);
  const [{ data: post }, { data: comments }, { data: tagRows }, { data: productRows }] = await Promise.all([
    supabase.from("posts").select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,user_id,image_url,profiles(id,nickname,email),galleries(name,slug,category)").eq("id", id).eq("is_deleted", false).single(),
    supabase.from("comments").select("id,content,like_count,created_at,user_id,profiles(id,nickname,email)").eq("post_id", id).eq("is_deleted", false).order("created_at", { ascending: true }),
    supabase.from("post_tags").select("tags(name)").eq("post_id", id),
    supabase.from("products").select(productSelect).eq("is_deleted", false).limit(30)
  ]);
  if (!post) notFound();
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const gallery = Array.isArray(post.galleries) ? post.galleries[0] : post.galleries;
  const dbTags = ((tagRows ?? []) as Array<{ tags?: { name?: string } | Array<{ name?: string }> | null }>).map((row) => Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name).filter(Boolean) as string[];
  const tags = dbTags.length ? dbTags : fallbackTags({ title: post.title, content: post.content, gallerySlug: gallery?.slug, galleryName: gallery?.name });
  const keywords = keywordsForPost({ title: post.title, content: post.content, gallerySlug: gallery?.slug, galleryName: gallery?.name, tags });
  const localRelatedProducts = relatedProducts((productRows ?? []).map(productFromDbRow), keywords, 4);
  const goods = localRelatedProducts.length ? localRelatedProducts : fallbackRecommendedProducts(keywords, 4);
  const isOwner = currentUserId === post.user_id;

  return <div className="grid gap-6 lg:grid-cols-[1fr_24rem]"><article className="space-y-5"><Card><div className="mb-4 flex flex-wrap items-center gap-2"><Badge tone="pink">{postTypeLabel(post.post_type)}</Badge><span className="text-sm font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"}</span><span className="text-sm font-bold text-slate-400">{formatDateTime(post.created_at)}</span></div><h1 className="text-3xl font-black leading-tight">{post.title}</h1>{post.image_url ? <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100"><Image src={post.image_url} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 760px" /></div> : null}<p className="mt-5 whitespace-pre-line leading-8 text-slate-700">{post.content}</p><div className="mt-5 flex flex-wrap gap-2">{(tags.length ? tags : ["세모덕"]).map((tag) => <Badge key={tag}>#{tag}</Badge>)}</div><PostActions postId={post.id} initialLikes={post.like_count} initialBookmarks={post.bookmark_count} initialLiked={false} initialBookmarked={false} isOwner={isOwner} isAdmin={isAdmin} /></Card><Card><h2 className="flex items-center gap-2 text-xl font-black"><MessageCircle size={20} /> 댓글 {comments?.length ?? 0}</h2><div className="mt-4 space-y-3">{(comments ?? []).map((comment) => { const writer = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles; const isCommentOwner = currentUserId === comment.user_id; const canDeleteComment = isCommentOwner || isAdmin; return <div key={comment.id} className="relative rounded-lg bg-cloud p-4 pr-24">{canDeleteComment && <CommentActions commentId={comment.id} initialContent={comment.content} canEdit={isCommentOwner} />}<p className="font-black">{writer?.nickname ?? writer?.email ?? "회원"}</p><p className="mt-2 text-slate-700">{comment.content}</p><p className="mt-2 text-xs font-bold text-slate-400">{formatDateTime(comment.created_at)}</p></div>; })}{!(comments ?? []).length && <p className="rounded-lg bg-cloud p-4 font-bold text-slate-500">아직 댓글이 없습니다.</p>}</div><CommentForm postId={post.id} /></Card></article><aside className="space-y-4"><div><p className="text-sm font-black text-berry">이 글과 함께 볼 굿즈</p><h2 className="mt-1 text-xl font-black">관련 굿즈</h2></div><div className="grid gap-4">{goods.map((product) => <ProductCard key={product.id} product={product} />)}</div></aside></div>;
}
