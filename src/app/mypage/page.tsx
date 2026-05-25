"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bookmark, ChevronLeft, ChevronRight, Edit3, Heart, HeartHandshake, Loader2, MessageCircle, PenLine, Settings, Star, Trash2, UserRound } from "lucide-react";
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
    ["작성글", activity.counts.posts, PenLine, ""],
    ["댓글", activity.counts.comments, MessageCircle, ""],
    ["스크랩", activity.counts.bookmarks, Star, "/mypage/bookmarks"],
    ["거래", activity.counts.marketItems, HeartHandshake, "/mypage/market"]
  ];
  const sideNav: Array<[string, LucideIcon, string]> = [
    ["프로필", UserRound, "/mypage"],
    ["내가 쓴 글", Edit3, "/mypage"],
    ["스크랩한 글", Bookmark, "/mypage/bookmarks"],
    ["관심 갤러리", PenLine, "/galleries"],
    ["찜한 굿즈", Heart, "/mypage/likes"],
    ["거래 내역", HeartHandshake, "/mypage/market"],
    ["알림 설정", Bell, "/mypage"],
    ["계정 설정", Settings, "/mypage"]
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
      <aside className="rounded-[1.5rem] border border-[#ead0f4] bg-white/84 p-3 shadow-soft">
        <nav className="grid gap-1">
          {sideNav.map(([label, Icon, href], index) => (
            <Link
              key={`${label}-${index}`}
              href={href}
              className={`flex min-h-10 items-center gap-2 rounded-2xl px-3 text-xs font-black text-[#2f2352] transition hover:bg-[#fff1f7] ${index === 0 ? "bg-[#f2e2ff]" : ""}`}
            >
              <Icon size={19} className="text-[#6f4ab4]" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 hidden lg:block">
          <Image src="/semoduck-profile-duck.png" alt="" width={160} height={160} className="mx-auto opacity-80" />
        </div>
      </aside>

      <div className="space-y-5">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-[#ead0f4] bg-white/84 p-4 shadow-[0_12px_34px_rgba(126,80,178,0.06)]">
          <div className="pointer-events-none absolute right-8 top-12 hidden text-5xl opacity-60 md:block">☆</div>
          <div className="grid gap-4 lg:grid-cols-[8.5rem_1fr_auto] lg:items-center">
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-[#fff0f6] ring-4 ring-[#ffe4f0] lg:mx-0">
              <Image src="/semoduck-profile-duck.png" alt="" fill className="object-cover" sizes="112px" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-[#3a285f]">{activity.profile.nickname}</h1>
                <Badge tone="violet">Lv. {Math.max(1, Math.min(99, activity.counts.posts + activity.counts.comments + 1))}</Badge>
              </div>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#5b506b]">
                안녕하세요! 세모덕에서 굿즈와 갤러리를 즐기는 {activity.profile.nickname}님이에요.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="gray">{activity.profile.email}</Badge>
                {activity.interests.slice(0, 4).map((interest) => (
                  <Badge key={interest} tone="mint">{interest}</Badge>
                ))}
              </div>
            </div>
            <Button variant="secondary" className="self-start">
              <Edit3 size={16} /> 프로필 수정
            </Button>
          </div>

          <div className="mt-4 grid overflow-hidden rounded-2xl border border-[#f1dbe8] bg-white/78 md:grid-cols-4">
            {stats.map(([label, value, Icon, href]) => {
              const inner = (
                <div className="flex items-center justify-center gap-3 border-[#f1dbe8] px-3 py-3 md:border-r">
                  <Icon size={24} className="text-[#a56be8]" />
                  <div>
                    <p className="text-sm font-black text-[#3a285f]">{label}</p>
                    <p className="text-xl font-black text-[#ff6f9b]">{value}</p>
                  </div>
                </div>
              );
              return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
            })}
          </div>
        </Card>

        <Card className="rounded-[1.75rem] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#3a285f]">내 관심 갤러리</h2>
            <Link href="/galleries" className="text-sm font-black text-[#6f4ab4]">더보기</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(activity.followedGalleries.length ? activity.followedGalleries : activity.interests.map((interest, index) => ({ id: `${interest}-${index}`, name: interest, slug: "", category: "관심사" }))).slice(0, 6).map((gallery) => (
              <Link key={gallery.id} href={gallery.slug ? `/galleries/${gallery.slug}` : "/galleries"} className="rounded-2xl border border-[#f1dbe8] bg-[#fff8fb] p-3 text-center transition hover:-translate-y-1 hover:shadow-soft">
                <div className="mx-auto grid h-14 w-20 place-items-center rounded-2xl bg-[#f2e2ff] text-xl font-black text-[#6f4ab4]">
                  {gallery.name.slice(0, 2)}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-black text-[#3a285f]">{gallery.name}</p>
                <p className="text-xs font-bold text-slate-400">{gallery.category}</p>
              </Link>
            ))}
            {!activity.followedGalleries.length && !activity.interests.length && <p className="col-span-full rounded-2xl bg-cloud p-4 text-sm font-bold text-slate-500">관심 갤러리나 관심사가 아직 없습니다.</p>}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="rounded-[1.75rem]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">내가 쓴 글</h2>
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

          <Card className="rounded-[1.75rem]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">최근 거래 내역</h2>
              <Link href="/mypage/market" className="text-sm font-black text-[#6f4ab4]">더보기</Link>
            </div>
            <div className="space-y-3">
              {activity.marketItems.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/market/${item.id}`} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-2xl bg-[#fbf4ff] p-3 hover:bg-[#fff5fa]">
                  <div className="grid h-16 w-16 place-items-center rounded-xl bg-white text-[#9d6de1]">
                    <HeartHandshake size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-black text-[#3a285f]">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{tradeTypeLabel(item.trade_type)} · {tradeStatusLabel(item.status)}</p>
                  </div>
                  <p className="text-sm font-black text-[#2f2352]">{item.price ? `${item.price.toLocaleString("ko-KR")}원` : "가격협의"}</p>
                </Link>
              ))}
              {!activity.marketItems.length && <p className="rounded-lg bg-cloud p-4 font-bold text-slate-500">아직 유저거래 글이 없습니다.</p>}
            </div>
          </Card>
        </div>

        <Card className="rounded-[1.75rem]">
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
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${active ? "bg-[#ffe1ec] text-[#f05f8e]" : "bg-white text-slate-500 ring-1 ring-[#ead8f4]"}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
