import Image from "next/image";
import { notFound } from "next/navigation";
import { Bookmark, Flag, Heart, MessageCircle } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { comments, posts, products } from "@/lib/mock-data";
import { postTypeLabel } from "@/lib/format";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = posts.find((item) => item.id === id);
  if (!post) notFound();

  const postComments = comments.filter((comment) => comment.postId === post.id);
  const related = products.filter((product) => product.tags.some((tag) => post.tags.includes(tag)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <article className="space-y-5">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="pink">{postTypeLabel(post.type)}</Badge>
            <span className="text-sm font-bold text-slate-500">{post.author}</span>
            <span className="text-sm font-bold text-slate-400">{post.createdAt}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight">{post.title}</h1>
          <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
            <Image src={post.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 760px" />
          </div>
          <p className="mt-5 whitespace-pre-line leading-8 text-slate-700">{post.content}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary">
              <Heart size={16} /> 좋아요 {post.likeCount}
            </Button>
            <Button variant="secondary">
              <Bookmark size={16} /> 북마크 {post.bookmarkCount}
            </Button>
            <Button variant="ghost">
              <Flag size={16} /> 신고
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <MessageCircle size={20} />
            댓글 {postComments.length}
          </h2>
          <div className="mt-4 space-y-3">
            {postComments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-cloud p-4">
                <p className="font-black">{comment.author}</p>
                <p className="mt-2 text-slate-700">{comment.content}</p>
              </div>
            ))}
          </div>
          <textarea className="mt-4 min-h-28 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-berry" placeholder="댓글을 입력하세요" />
          <div className="mt-3 flex justify-end">
            <Button>댓글 등록</Button>
          </div>
        </Card>
      </article>

      <aside className="space-y-4">
        <h2 className="text-xl font-black">관련 굿즈</h2>
        {related.length ? related.map((product) => <ProductCard key={product.id} product={product} />) : <Card>관련 굿즈가 없습니다.</Card>}
      </aside>
    </div>
  );
}
