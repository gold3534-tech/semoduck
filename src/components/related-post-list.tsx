import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { postTypeLabel } from "@/lib/format";

export type RelatedPostItem = {
  id: string;
  title: string;
  content?: string | null;
  post_type: string;
  like_count?: number | null;
  comment_count?: number | null;
  image_url?: string | null;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

export function RelatedPostList({ title, posts, emptyText = "아직 관련 게시글이 없습니다." }: { title: string; posts: RelatedPostItem[]; emptyText?: string }) {
  return (
    <Card className="h-fit p-4">
      <h2 className="flex items-center gap-2 text-lg font-black text-[#3a285f]">
        <Star size={18} className="fill-[#9b63d6] text-[#9b63d6]" />
        {title}
      </h2>
      <div className="mt-3 space-y-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="grid grid-cols-[5.5rem_1fr] gap-3 rounded-2xl border border-[#f3dce9] bg-white/72 p-2 transition hover:-translate-y-0.5 hover:border-[#ff9fc0]">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
              {post.image_url ? <Image src={post.image_url} alt="" fill className="object-cover" sizes="88px" /> : null}
            </div>
            <div className="min-w-0">
              <Badge tone="violet">{postTypeLabel(post.post_type)}</Badge>
              <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-[#2f2352]">{post.title}</p>
              <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">{post.galleries?.name ?? "세모덕"} · {post.content ?? "덕질 이야기"}</p>
              <p className="mt-2 flex items-center gap-3 text-[11px] font-bold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={12} /> {post.comment_count ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 text-[#ff6f9b]">
                  <Heart size={12} /> {post.like_count ?? 0}
                </span>
              </p>
            </div>
          </Link>
        ))}
        {!posts.length ? <p className="rounded-2xl bg-[#fbf4ff] p-4 text-sm font-bold text-slate-500">{emptyText}</p> : null}
      </div>
      {posts.length ? (
        <Link href="/galleries" className="mt-3 inline-flex min-h-8 w-full items-center justify-center rounded-xl bg-white text-xs font-black text-[#6f4ab4] ring-1 ring-[#ead8f4]">
          게시글 더 보기
        </Link>
      ) : null}
    </Card>
  );
}
