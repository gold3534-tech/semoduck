import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import type { RelatedPostItem } from "@/lib/related-post-items";

export function RelatedPostCard({ post }: { post: RelatedPostItem }) {
  return (
    <Link href={`/posts/${post.id}`} className="block">
      <Card className="rounded-2xl border-[#f1dbe8] bg-white/88 p-3 transition hover:bg-[#fff5fa]">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="pink">{postTypeLabel(post.postType)}</Badge>
          <Badge tone="mint">{post.galleryName || "갤러리"}</Badge>
        </div>

        <p className="line-clamp-2 text-sm font-black leading-5 text-[#2f2352]">
          {post.title}
        </p>

        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">
          {post.content}
        </p>

        {post.reason ? (
          <p className="mt-2 line-clamp-1 text-[11px] font-bold text-slate-400">
            {post.reason}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
          <span>{formatDateTime(post.createdAt)}</span>

          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Heart size={12} />
              {post.likeCount}
            </span>

            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} />
              {post.commentCount}
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}