"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, ChevronRight, Heart, HeartHandshake, Loader2, MessageCircle, PenLine, Settings, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel, tradeStatusLabel, tradeTypeLabel } from "@/lib/format";

type Profile = { email: string; nickname: string; role: "admin" | "user" | "guest" };
type LinkedPost = { id: string; title: string; post_type?: string; created_at?: string; galleries?: { name: string; slug: string } | null };
type ActivityPost = LinkedPost & { like_count: number; comment_count: number; bookmark_count: number };
type ActivityComment = { id: string; content: string; created_at: string; posts?: { id: string; title: string } | null };
type ActivityMarketItem = { id: string; title: string; trade_type: string; status: string; price: number; created_at: string };
type FollowedGallery = { id: string; name: string; slug: string; category: string };
type ActivityResponse = {
  profile: Profile;
  posts: ActivityPost[];
  comments: ActivityComment[];
  marketItems: ActivityMarketItem[];
  likedPosts: LinkedPost[];
  bookmarkedPosts: LinkedPost[];
  interests: string[];
  allInterests: string[];
  followedGalleries: FollowedGallery[];
  counts: { posts: number; comments: number; bookmarks: number; likes: number; marketItems: number };
};

const pageSize = 4;

export default function MyPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    const response = await fetch("/api/me/activity", { cache: "no-store" });
    if (response.status === 401) {
      router.replace("/login?next=/mypage");
      return;
    }
    const data = (await response.json()) as ActivityResponse | { error: string };
    if (!response.ok || "error" in data) throw new Error("error" in data ? data.error : "마이페이지 정보를 불러오지 못했습니다.");
    setActivity(data);
    setSelectedInterests(data.interests);
  }

  useEffect(() => {
    load()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "마이페이지 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const pagedPosts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return activity?.posts.slice(start, start + pageSize) ?? [];
  }, [activity, page]);

  async function saveProfile() {
    setSaving(true);
    const response = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selectedInterests })
    });
    setSaving(false);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "저장하지 못했습니다.");
      return;
    }
    await load();
  }

  async function deletePost(postId: string) {
    if (!confirm("게시글을 삭제할까요?")) return;
    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "삭제하지 못했습니다.");
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <Loader2 className="animate-spin text-berry" size={32} />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <Card>
        <p className="font-bold text-pink-700">{error || "마이페이지 정보를 불러오지 못했습니다."}</p>
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil(activity.posts.length / pageSize));
  const stats: Array<[string, number, LucideIcon, string]> = [
    ["내가 쓴 글", activity.counts.posts, PenLine, ""],
    ["내 댓글", activity.counts.comments, MessageCircle, ""],
    ["좋아요한 글", activity.counts.likes, Heart, "/mypage/likes"],
    ["스크랩한 글", activity.counts.bookmarks, Bookmark, "/mypage/bookmarks"]
  ];

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[2rem] border-2 border-[#ead0f4] bg-white/80 p-8 shadow-[0_18px_60px_rgba(126,80,178,0.08)] lg:grid lg:grid-cols-[1fr_28rem] lg:gap-5">
        <div className="pointer-events-none absolute right-8 top-8 hidden text-7xl md:block">✨</div>
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 overflow-hidden rounded-full bg-[#fff0f6] ring-8 ring-[#ffe4f0]">
            <Image src="/semoduck-profile-duck.png" alt="" fill className="object-cover" sizes="128px" />
          </div>
          <div>
            <p className="text-sm font-black text-[#ff6f9b]">마이페이지</p>
            <h1 className="text-3xl font-black text-[#3a285f]">{activity.profile.nickname}</h1>
            <p className="text-sm font-bold text-slate-500">{activity.profile.email}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#f8f2fb] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <Settings size={16} />
              관심사 수정
            </h2>
            <Button className="min-h-8 px-3 py-1 text-xs" onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              저장
            </Button>
          </div>
          <div className="flex max-h-28 flex-wrap gap-2 overflow-auto pr-1">
            {activity.allInterests.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => setSelectedInterests((current) => (active ? current.filter((item) => item !== interest) : [...current, interest]))}
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${active ? "bg-[#ffe1ec] text-[#f05f8e]" : "bg-white text-slate-500"}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value, Icon, href]) => {
          const inner = (
            <Card className={href ? "transition hover:-translate-y-1 hover:bg-[#fff5fa]" : ""}>
              <Icon size={20} className="text-[#9d6de1]" />
              <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-black">{value}</p>
            </Card>
          );
          return href ? (
            <Link key={label} href={href}>
              {inner}
            </Link>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">내가 쓴 글</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">게시글을 누르면 상세로 이동합니다.</p>
            </div>
            <Link href="/posts/new">
              <Button variant="secondary">
                <PenLine size={16} /> 글쓰기
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {pagedPosts.map((post) => (
              <div key={post.id} className="rounded-2xl bg-[#fbf4ff] p-4 hover:bg-[#fff5fa]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/posts/${post.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="pink">{postTypeLabel(post.post_type ?? "")}</Badge>
                      <span className="text-xs font-bold text-slate-500">{post.galleries?.name ?? "갤러리"}</span>
                      <span className="text-xs font-bold text-slate-400">{post.created_at ? formatDateTime(post.created_at) : ""}</span>
                    </div>
                    <p className="mt-2 font-black text-ink">{post.title}</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      좋아요 {post.like_count} · 댓글 {post.comment_count} · 스크랩 {post.bookmark_count}
                    </p>
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <Link href={`/posts/${post.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-black text-slate-600 hover:text-ink">
                      수정
                    </Link>
                    <button onClick={() => deletePost(post.id)} className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-black text-rose-600 hover:bg-rose-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!pagedPosts.length && <p className="rounded-lg bg-cloud p-4 font-bold text-slate-500">아직 작성한 글이 없습니다.</p>}
          </div>
          {activity.posts.length > pageSize && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-black text-slate-500">{page} / {totalPages}</span>
              <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-black">내 댓글</h2>
            <div className="mt-3 space-y-2">
              {activity.comments.slice(0, 5).map((comment) => (
                <Link key={comment.id} href={`/posts/${comment.posts?.id ?? ""}`} className="block rounded-2xl bg-[#fbf4ff] p-3 text-sm font-bold text-slate-700 hover:text-[#ff6f9b]">
                  <p className="line-clamp-2">{comment.content}</p>
                  <p className="mt-1 text-xs text-slate-400">{comment.posts?.title} · {formatDateTime(comment.created_at)}</p>
                </Link>
              ))}
              {!activity.comments.length && <p className="rounded-lg bg-cloud p-3 text-sm font-bold text-slate-500">아직 댓글이 없습니다.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 font-black">
              <Star size={18} /> 자주가는 갤러리
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {activity.followedGalleries.map((gallery) => (
                <Link key={gallery.id} href={`/galleries/${gallery.slug}`} className="rounded-full bg-[#d8fbf4] px-3 py-2 text-sm font-black text-teal-700 hover:bg-teal-200">
                  {gallery.name}
                </Link>
              ))}
              {!activity.followedGalleries.length && <p className="rounded-lg bg-cloud p-3 text-sm font-bold text-slate-500">아직 추가한 갤러리가 없습니다.</p>}
            </div>
          </Card>

          <Link href="/mypage/market" className="block">
            <Card className="transition hover:bg-pink-50">
              <h2 className="flex items-center gap-2 font-black">
                <HeartHandshake size={18} /> 내 유저거래 글
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">{activity.counts.marketItems}개 등록됨</p>
              <div className="mt-3 space-y-2">
                {activity.marketItems.slice(0, 3).map((item) => (
                  <p key={item.id} className="rounded-lg bg-white p-3 text-sm font-bold text-slate-700">
                    {item.title} · {tradeTypeLabel(item.trade_type)} · {tradeStatusLabel(item.status)}
                  </p>
                ))}
                {!activity.marketItems.length && <p className="rounded-lg bg-white p-3 text-sm font-bold text-slate-500">아직 유저거래 글이 없습니다.</p>}
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
