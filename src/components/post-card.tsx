import Link from "next/link";
import { MessageCircle, Star } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { postTypeLabel } from "@/lib/format";
import type { Post } from "@/types/domain";

export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="grid gap-4 sm:grid-cols-[10rem_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 sm:aspect-square">
        <SafeImage src={post.image} alt="" kind="product" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone={post.type === "purchase_help" ? "pink" : "mint"}>{postTypeLabel(post.type)}</Badge>
          <span className="text-xs font-bold text-slate-400">{post.createdAt}</span>
        </div>
        <Link href={`/posts/${post.id}`} className="line-clamp-2 text-lg font-black text-ink hover:text-berry">
          {post.title}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Star size={15} /> {post.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={15} /> {post.commentCount}
          </span>
        </div>
      </div>
    </Card>
  );
}
