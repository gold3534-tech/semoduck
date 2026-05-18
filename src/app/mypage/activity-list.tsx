"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel, tradeStatusLabel, tradeTypeLabel } from "@/lib/format";

type LinkedPost = { id: string; title: string; post_type?: string; created_at?: string; galleries?: { name: string; slug: string } | null };
type ActivityMarketItem = { id: string; title: string; trade_type: string; status: string; price: number; created_at: string };
type ActivityResponse = {
  likedPosts: LinkedPost[];
  bookmarkedPosts: LinkedPost[];
  marketItems: ActivityMarketItem[];
};

export function MyActivityList({ type }: { type: "likes" | "bookmarks" | "market" }) {
  const router = useRouter();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me/activity", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace(`/login?next=/mypage/${type}`);
          return null;
        }
        if (!response.ok) throw new Error("활동 내역을 불러오지 못했습니다.");
        return (await response.json()) as ActivityResponse;
      })
      .then((result) => {
        if (result) setData(result);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "활동 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [router, type]);

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <Loader2 className="animate-spin text-berry" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <p className="font-bold text-pink-700">{error || "활동 내역을 불러오지 못했습니다."}</p>
      </Card>
    );
  }

  if (type === "market") {
    return (
      <div className="space-y-3">
        {data.marketItems.map((item) => (
          <Link key={item.id} href={`/market/${item.id}`} className="block">
            <Card className="transition hover:bg-pink-50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                <Badge>{tradeStatusLabel(item.status)}</Badge>
              </div>
              <p className="mt-3 text-lg font-black">{item.title}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{formatDateTime(item.created_at)}</p>
            </Card>
          </Link>
        ))}
        {!data.marketItems.length && <Card>아직 등록한 마켓 글이 없습니다.</Card>}
      </div>
    );
  }

  const posts = type === "likes" ? data.likedPosts : data.bookmarkedPosts;
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} className="block">
          <Card className="transition hover:bg-pink-50">
            <div className="flex flex-wrap items-center gap-2">
              {post.post_type && <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge>}
              <span className="text-xs font-bold text-slate-500">{post.galleries?.name ?? "갤러리"}</span>
            </div>
            <p className="mt-3 text-lg font-black">{post.title}</p>
            {post.created_at && <p className="mt-1 text-sm font-bold text-slate-500">{formatDateTime(post.created_at)}</p>}
          </Card>
        </Link>
      ))}
      {!posts.length && <Card>{type === "likes" ? "아직 좋아요한 글이 없습니다." : "아직 스크랩한 글이 없습니다."}</Card>}
    </div>
  );
}
