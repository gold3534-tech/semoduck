import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { CommentActions } from "@/app/posts/[id]/comment-actions";
import { CommentForm } from "@/app/posts/[id]/comment-form";
import { PostActions } from "@/app/posts/[id]/post-actions";
import { RelatedSideCard } from "@/components/related-side-card";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import { fallbackTags } from "@/lib/product-recommendations";
import { getRelatedSideItems } from "@/lib/related-side-items";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();

  const { data: userData } = (await authClient?.auth.getUser()) ?? {
    data: { user: null },
  };

  const currentUserId = userData.user?.id ?? null;
  const isAdmin = isAdminEmail(userData.user?.email);

  const [{ data: post }, { data: comments }, { data: tagRows }] =
    await Promise.all([
      supabase
        .from("posts")
        .select(
          "id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,user_id,image_url,profiles(id,nickname,email),galleries(id,name,slug,category)"
        )
        .eq("id", id)
        .eq("is_deleted", false)
        .single(),

      supabase
        .from("comments")
        .select(
          "id,content,like_count,created_at,user_id,profiles(id,nickname,email)"
        )
        .eq("post_id", id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true }),

      supabase.from("post_tags").select("tags(name)").eq("post_id", id),
    ]);

  if (!post) {
    notFound();
  }

  const profile = Array.isArray(post.profiles)
    ? post.profiles[0]
    : post.profiles;

  const gallery = Array.isArray(post.galleries)
    ? post.galleries[0]
    : post.galleries;

  const dbTags = (
    (tagRows ?? []) as Array<{
      tags?: { name?: string } | Array<{ name?: string }> | null;
    }>
  )
    .map((row) =>
      Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name
    )
    .filter(Boolean) as string[];

  const tags = dbTags.length
    ? dbTags
    : fallbackTags({
        title: post.title,
        content: post.content,
        gallerySlug: gallery?.slug,
        galleryName: gallery?.name,
      });

  const relatedItems = gallery
    ? await getRelatedSideItems({
        supabase,
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
        },
        gallery: {
          id: gallery.id,
          slug: gallery.slug,
          name: gallery.name,
          category: gallery.category,
        },
        tags,
      })
    : [];

  const isOwner = currentUserId === post.user_id;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <article className="space-y-4">
        <Card className="overflow-hidden rounded-[1.5rem] border-[#efd7e7] bg-gradient-to-br from-white via-[#fffafd] to-[#fff6fb] p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge>

            {gallery ? (
              <Link href={`/galleries/${gallery.slug}`}>
                <Badge tone="mint">{gallery.name}</Badge>
              </Link>
            ) : null}

            <span className="text-xs font-bold text-slate-500">
              {profile?.nickname ?? profile?.email ?? "회원"}
            </span>

            <span className="text-xs font-bold text-slate-400">
              {formatDateTime(post.created_at)}
            </span>
          </div>

          <h1 className="text-2xl font-black leading-tight text-[#3a285f] md:text-3xl">
            {post.title}
          </h1>

          <p className="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-slate-700">
            {post.content}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(tags.length ? tags : ["세모덕"]).map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>

          {post.image_url ? (
            <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-[1.25rem] bg-[#f7f2fb] ring-1 ring-[#efd7e7]">
              <SafeImage
                src={post.image_url}
                alt={post.title}
                kind="product"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <PostActions
            postId={post.id}
            initialLikes={post.like_count}
            initialBookmarks={post.bookmark_count}
            initialLiked={false}
            initialBookmarked={false}
            isOwner={isOwner}
            isAdmin={isAdmin}
          />
        </Card>

        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]">
            <MessageCircle size={18} />
            댓글 {comments?.length ?? 0}
          </h2>

          <div className="mt-3 space-y-2">
            {(comments ?? []).map((comment) => {
              const writer = Array.isArray(comment.profiles)
                ? comment.profiles[0]
                : comment.profiles;

              const isCommentOwner = currentUserId === comment.user_id;
              const canDeleteComment = isCommentOwner || isAdmin;

              return (
                <div
                  key={comment.id}
                  className="relative rounded-2xl bg-[#fff7fb] p-3 pr-20 ring-1 ring-[#f2deeb]"
                >
                  {canDeleteComment ? (
                    <CommentActions
                      commentId={comment.id}
                      initialContent={comment.content}
                      canEdit={isCommentOwner}
                    />
                  ) : null}

                  <p className="text-sm font-black">
                    {writer?.nickname ?? writer?.email ?? "회원"}
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {comment.content}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {formatDateTime(comment.created_at)}
                  </p>
                </div>
              );
            })}

            {!(comments ?? []).length ? (
              <p className="rounded-2xl bg-[#fff7fb] p-3 text-sm font-bold text-slate-500">
                아직 댓글이 없습니다.
              </p>
            ) : null}
          </div>

          <CommentForm postId={post.id} />
        </Card>
      </article>

      <aside className="space-y-3">
        <div>
          <p className="text-sm font-black text-[#ff6f9b]">
            이 글과 함께 볼 굿즈
          </p>

          <h2 className="text-xl font-black text-[#3a285f]">관련 추천</h2>

          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            게시글의 갤러리, 제목, 내용, 태그를 기준으로 관련 유저거래,
            내부 굿즈, 쇼핑 검색 결과를 추천해요.
          </p>
        </div>

        {relatedItems.length > 0 ? (
          <div className="grid gap-3">
            {relatedItems.map((item) => (
              <RelatedSideCard
                key={`${item.kind}-${item.id}`}
                item={item}
              />
            ))}
          </div>
        ) : (
          <Card className="p-4 text-sm font-bold text-slate-500">
            이 글과 관련된 굿즈나 거래글이 아직 없습니다.
          </Card>
        )}

        {gallery ? (
          <Card className="rounded-[1.5rem] border-[#ead8f4] bg-[#fff8fb] p-4">
            <p className="text-sm font-black text-[#6f4ab4]">
              {gallery.name} 갤러리
            </p>

            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
              비슷한 덕질 이야기와 굿즈 정보를 더 보고 싶다면 갤러리로
              이동해보세요.
            </p>

            <Link
              href={`/galleries/${gallery.slug}`}
              className="mt-3 inline-flex h-9 items-center rounded-full bg-white px-4 text-xs font-black text-[#6f4ab4] ring-1 ring-[#ead8f4] transition hover:bg-[#fff0f6]"
            >
              갤러리 보기
            </Link>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}