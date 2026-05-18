import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { CommentActions } from "@/app/posts/[id]/comment-actions";
import { CommentForm } from "@/app/posts/[id]/comment-form";
import { PostActions } from "@/app/posts/[id]/post-actions";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

type DbPostResponse = {
  post: {
    id: string;
    title: string;
    content: string;
    post_type: string;
    like_count: number;
    comment_count: number;
    bookmark_count: number;
    created_at: string;
    user_id: string;
    image_url?: string | null;
    profiles?: { id?: string; nickname?: string; email?: string } | null;
    galleries?: { name?: string; slug?: string; category?: string } | null;
  };
  comments: Array<{
    id: string;
    content: string;
    like_count: number;
    created_at: string;
    user_id: string;
    profiles?: { id?: string; nickname?: string; email?: string } | null;
  }>;
  tags: string[];
};

async function getDbPost(id: string): Promise<DbPostResponse | null> {
  const admin = createAdminSupabaseClient();
  const [postResult, commentsResult, tagsResult] = await Promise.all([
    admin
      .from("posts")
      .select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,user_id,image_url,profiles(id,nickname,email),galleries(name,slug,category)")
      .eq("id", id)
      .eq("is_deleted", false)
      .single(),
    admin
      .from("comments")
      .select("id,content,like_count,created_at,user_id,profiles(id,nickname,email)")
      .eq("post_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
    admin.from("post_tags").select("tags(name)").eq("post_id", id)
  ]);

  if (postResult.error || !postResult.data) return null;

  return {
    post: postResult.data as DbPostResponse["post"],
    comments: (commentsResult.data ?? []) as DbPostResponse["comments"],
    tags: ((tagsResult.data ?? []) as Array<{ tags?: { name?: string } | Array<{ name?: string }> | null }>)
      .map((row) => (Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name))
      .filter(Boolean) as string[]
  };
}

async function getRelatedProducts(category: string | undefined, tags: string[]) {
  const admin = createAdminSupabaseClient();
  const keyword = category || tags[0] || "";
  const { data } = await admin
    .from("products")
    .select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)")
    .or(keyword ? `category.ilike.%${keyword}%,title.ilike.%${keyword}%` : "title.ilike.%%")
    .limit(3);

  return (data ?? []).map((product) => ({
    id: product.id,
    title: product.title,
    normalizedTitle: product.normalized_title,
    brand: product.brand ?? "",
    category: product.category,
    description: product.description ?? "",
    image: product.image_url ?? "/placeholder-goods.svg",
    isOfficialProduct: product.is_official_product ?? false,
    tags: [product.category, product.brand].filter(Boolean) as string[],
    gallerySlugs: [],
    bookmarkCount: product.bookmark_count ?? 0,
    offers: ((product.product_offers ?? []) as Array<{
      id: string;
      source: Product["offers"][number]["source"];
      mall_name: string;
      price: number;
      shipping_fee: number;
      condition: Product["offers"][number]["condition"];
      is_official: boolean;
      is_used: boolean;
      special_benefit?: string | null;
      url: string;
    }>).map((offer) => ({
      id: offer.id,
      source: offer.source,
      mallName: offer.mall_name,
      price: offer.price,
      shippingFee: offer.shipping_fee,
      condition: offer.condition,
      isOfficial: offer.is_official,
      isUsed: offer.is_used,
      specialBenefit: offer.special_benefit ?? undefined,
      url: offer.url
    }))
  }));
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const currentUserId = userData.user?.id ?? null;
  const dbPost = await getDbPost(id);

  if (!dbPost) notFound();

  const post = dbPost.post;
  const tags = dbPost.tags.length ? dbPost.tags : [post.galleries?.name ?? "세모덕"];
  const related = await getRelatedProducts(post.galleries?.category, tags);
  const isOwner = currentUserId === post.user_id;
  let initialLiked = false;
  let initialBookmarked = false;

  if (currentUserId) {
    const admin = createAdminSupabaseClient();
    const { data: reactions } = await admin.from("post_reactions").select("type").eq("post_id", post.id).eq("user_id", currentUserId);
    initialLiked = Boolean(reactions?.some((reaction) => reaction.type === "like"));
    initialBookmarked = Boolean(reactions?.some((reaction) => reaction.type === "bookmark"));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <article className="space-y-5">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge>
            <span className="text-sm font-bold text-slate-500">{post.profiles?.nickname ?? post.profiles?.email ?? "회원"}</span>
            <span className="text-sm font-bold text-slate-400">{formatDateTime(post.created_at)}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight">{post.title}</h1>
          {post.image_url ? (
            <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
              <Image src={post.image_url} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 760px" />
            </div>
          ) : null}
          <p className="mt-5 whitespace-pre-line leading-8 text-slate-700">{post.content}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
          <PostActions postId={post.id} initialLikes={post.like_count} initialBookmarks={post.bookmark_count} initialLiked={initialLiked} initialBookmarked={initialBookmarked} isOwner={isOwner} />
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <MessageCircle size={20} />
            댓글 {dbPost.comments.length}
          </h2>
          <div className="mt-4 space-y-3">
            {dbPost.comments.map((comment) => {
              const isCommentOwner = currentUserId === comment.user_id;
              return (
                <div key={comment.id} className="relative rounded-lg bg-cloud p-4 pr-24">
                  {isCommentOwner && <CommentActions commentId={comment.id} initialContent={comment.content} />}
                  <p className="font-black">{comment.profiles?.nickname ?? comment.profiles?.email ?? "회원"}</p>
                  <p className="mt-2 text-slate-700">{comment.content}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400">{formatDateTime(comment.created_at)}</p>
                </div>
              );
            })}
            {!dbPost.comments.length && <p className="rounded-lg bg-cloud p-4 font-bold text-slate-500">아직 댓글이 없습니다.</p>}
          </div>
          <CommentForm postId={post.id} />
        </Card>
      </article>

      <aside className="space-y-4">
        <h2 className="text-xl font-black">관련 굿즈</h2>
        {related.length ? related.map((product) => <ProductCard key={product.id} product={product} />) : <Card>관련 굿즈가 없습니다.</Card>}
      </aside>
    </div>
  );
}
