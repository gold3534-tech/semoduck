"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Edit3, Heart, HeartHandshake, Loader2, MessageCircle, PenLine, Star, Trash2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, postTypeLabel, tradeStatusLabel, tradeTypeLabel } from "@/lib/format";

type Profile = { email: string; nickname: string; role: "admin" | "user" | "guest" };
type LinkedPost = {
  id: string;
  title: string;
  post_type?: string;
  created_at?: string;
  like_count?: number;
  comment_count?: number;
  bookmark_count?: number;
  galleries?: { name: string; slug: string } | null;
};
type ActivityPost = LinkedPost & { like_count: number; comment_count: number; bookmark_count: number };
type ActivityMarketItem = { id: string; title: string; trade_type: string; status: string; price: number; created_at: string };
type FollowedGallery = { id: string; name: string; slug: string; category: string; thumbnail_url?: string | null };
type ActivityResponse = {
  profile: Profile;
  posts: ActivityPost[];
  comments: Array<{ id: string; content: string; created_at: string; posts?: LinkedPost | LinkedPost[] | null }>;
  marketItems: ActivityMarketItem[];
  likedPosts: LinkedPost[];
  bookmarkedPosts: LinkedPost[];
  interests: string[];
  allInterests: string[];
  followedGalleries: FollowedGallery[];
  counts: { posts: number; comments: number; bookmarks: number; likes: number; marketItems: number };
};

type TabKey = "profile" | "posts" | "comments" | "bookmarks" | "likes" | "goods" | "market";

const tabs: Array<[TabKey, string, LucideIcon]> = [
  ["profile", "프로필", UserRound],
  ["posts", "내가 쓴 글", PenLine],
  ["comments", "댓글 쓴 글", MessageCircle],
  ["bookmarks", "스크랩한 글", Bookmark],
  ["likes", "좋아요 누른 글", Heart],
  ["goods", "찜한 굿즈", Star],
  ["market", "거래 내역", HeartHandshake]
];

const tabTitles: Record<TabKey, string> = {
  profile: "프로필",
  posts: "내가 쓴 글",
  comments: "댓글 쓴 글",
  bookmarks: "스크랩한 글",
  likes: "좋아요 누른 글",
  goods: "찜한 굿즈",
  market: "거래 내역"
};

function normalizeTab(value: string | null): TabKey {
  return tabs.some(([key]) => key === value) ? (value as TabKey) : "profile";
}

function postList(posts: LinkedPost[], emptyText: string, onDelete?: (postId: string) => void) {
  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div key={post.id} className="rounded-2xl bg-[#fbf4ff] p-3 transition hover:bg-[#fff5fa]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Link href={`/posts/${post.id}`} className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {post.post_type ? <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge> : null}
                <span className="text-xs font-bold text-slate-500">{post.galleries?.name ?? "갤러리"}</span>
                {post.created_at ? <span className="text-xs font-bold text-slate-400">{formatDateTime(post.created_at)}</span> : null}
              </div>
              <p className="mt-2 line-clamp-1 font-black text-[#2f2352]">{post.title}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                좋아요 {post.like_count ?? 0} · 댓글 {post.comment_count ?? 0} · 스크랩 {post.bookmark_count ?? 0}
              </p>
            </Link>
            {onDelete ? (
              <div className="flex shrink-0 gap-1">
                <Link href={`/posts/${post.id}/edit`} className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-black text-slate-600 hover:text-ink">
                  수정
                </Link>
                <button onClick={() => onDelete(post.id)} className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-black text-rose-600 hover:bg-rose-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
      {!posts.length ? <p className="rounded-xl bg-cloud p-4 text-sm font-bold text-slate-500">{emptyText}</p> : null}
    </div>
  );
}

function commentList(comments: ActivityResponse["comments"], emptyText: string) {
  const visibleComments = comments.filter((comment) => {
    const post = Array.isArray(comment.posts) ? comment.posts[0] : comment.posts;
    return Boolean(post?.id);
  });

  return (
    <div className="space-y-2">
      {visibleComments.map((comment) => {
        const post = Array.isArray(comment.posts) ? comment.posts[0] : comment.posts;
        if (!post?.id) return null;

        return (
          <Link key={comment.id} href={`/posts/${post.id}`} className="block rounded-2xl bg-[#fbf4ff] p-3 transition hover:bg-[#fff5fa]">
            <div className="flex flex-wrap items-center gap-2">
              {post.post_type ? <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge> : null}
              <span className="text-xs font-bold text-slate-500">{post.galleries?.name ?? "갤러리"}</span>
              <span className="text-xs font-bold text-slate-400">댓글 {formatDateTime(comment.created_at)}</span>
            </div>
            <p className="mt-2 line-clamp-1 font-black text-[#2f2352]">{post.title}</p>
            <p className="mt-1 line-clamp-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold leading-5 text-slate-600">{comment.content}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">
              원글 좋아요 {post.like_count ?? 0} · 댓글 {post.comment_count ?? 0} · 스크랩 {post.bookmark_count ?? 0}
            </p>
          </Link>
        );
      })}
      {!visibleComments.length ? <p className="rounded-xl bg-cloud p-4 text-sm font-bold text-slate-500">{emptyText}</p> : null}
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

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
    setNicknameDraft(data.profile.nickname);
  }

  useEffect(() => {
    setActiveTab(normalizeTab(new URLSearchParams(window.location.search).get("tab")));
    load()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "마이페이지 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const stats: Array<[string, number, LucideIcon]> = useMemo(
    () =>
      activity
        ? [
            ["작성글", activity.counts.posts, PenLine],
            ["댓글", activity.counts.comments, MessageCircle],
            ["스크랩", activity.counts.bookmarks, Star],
            ["거래", activity.counts.marketItems, HeartHandshake]
          ]
        : [],
    [activity]
  );

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    router.replace(tab === "profile" ? "/mypage" : `/mypage?tab=${tab}`, { scroll: false });
  }

  async function saveProfile() {
    if (!activity) return;
    setSaving(true);
    const response = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nicknameDraft, interests: selectedInterests })
    });
    setSaving(false);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "저장하지 못했습니다.");
      return;
    }
    setEditing(false);
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

  return (
    <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
      <aside className="rounded-[1.5rem] border border-[#ead0f4] bg-white/84 p-3 shadow-soft">
        <nav className="grid gap-1">
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`flex min-h-10 items-center gap-2 rounded-2xl px-3 text-xs font-black text-[#2f2352] transition hover:bg-[#fff1f7] ${activeTab === key ? "bg-[#f2e2ff]" : ""}`}
            >
              <Icon size={18} className="text-[#6f4ab4]" />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-10 hidden lg:block">
          <Image src="/semoduck-profile-duck.png" alt="" width={150} height={150} className="mx-auto opacity-80" />
        </div>
      </aside>

      <div className="space-y-4">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-[#ead0f4] bg-white/84 p-4 shadow-[0_12px_34px_rgba(126,80,178,0.06)]">
          <div className="grid gap-4 lg:grid-cols-[8.5rem_1fr_auto] lg:items-start">
            <div className="relative mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-[#fff0f6] ring-4 ring-[#ffe4f0] lg:mx-0">
              <Image src="/semoduck-profile-duck.png" alt="" width={96} height={96} className="h-24 w-24 object-contain" />
              <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white text-[#ff6f9b] ring-1 ring-[#f4dbe7]">
                <Heart size={15} className="fill-current" />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-[#3a285f]">{activity.profile.nickname}</h1>
                <Badge tone="violet">Lv. {Math.max(1, Math.min(99, activity.counts.posts + activity.counts.comments + 1))}</Badge>
              </div>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#5b506b]">안녕하세요! 세모덕에서 굿즈와 갤러리를 즐기는 {activity.profile.nickname}님이에요.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="gray">{activity.profile.email}</Badge>
                {activity.interests.slice(0, 4).map((interest) => (
                  <Badge key={interest} tone="mint">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="secondary" className="min-h-9 rounded-xl px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
              <Edit3 size={15} /> 프로필 수정
            </Button>
          </div>

          <div className="mt-4 grid overflow-hidden rounded-2xl border border-[#f1dbe8] bg-white/78 md:grid-cols-4">
            {stats.map(([label, value, Icon]) => (
              <div key={label} className="flex items-center justify-center gap-3 border-[#f1dbe8] px-3 py-3 md:border-r">
                <Icon size={24} className="text-[#a56be8]" />
                <div>
                  <p className="text-sm font-black text-[#3a285f]">{label}</p>
                  <p className="text-xl font-black text-[#ff6f9b]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.75rem] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#3a285f]">{tabTitles[activeTab]}</h2>
            {activeTab === "posts" ? (
              <Link href="/posts/new">
                <Button variant="secondary" className="min-h-9 rounded-xl px-3 py-1.5 text-xs">
                  <PenLine size={15} /> 글쓰기
                </Button>
              </Link>
            ) : null}
          </div>

          {activeTab === "profile" ? (
            <div className="space-y-5">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#3a285f]">내 관심 갤러리</h3>
                  <Link href="/galleries" className="text-sm font-black text-[#6f4ab4]">
                    더보기
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {activity.followedGalleries.slice(0, 5).map((gallery) => (
                    <Link key={gallery.id} href={`/galleries/${gallery.slug}`} className="rounded-2xl border border-[#f1dbe8] bg-[#fff8fb] p-3 text-center transition hover:-translate-y-1 hover:shadow-soft">
                      <div className="relative mx-auto h-16 w-20 overflow-hidden rounded-2xl bg-[#f2e2ff]">
                        {gallery.thumbnail_url ? <Image src={gallery.thumbnail_url} alt="" fill className="object-cover" sizes="80px" /> : <span className="grid h-full place-items-center text-xl font-black text-[#6f4ab4]">{gallery.name.slice(0, 2)}</span>}
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm font-black text-[#3a285f]">{gallery.name}</p>
                      <p className="text-xs font-bold text-slate-400">{gallery.category}</p>
                    </Link>
                  ))}
                  {!activity.followedGalleries.length ? <p className="col-span-full rounded-2xl bg-cloud p-4 text-sm font-bold text-slate-500">아직 관심 갤러리가 없습니다.</p> : null}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-3">
                <section>
                  <h3 className="mb-3 text-lg font-black text-[#3a285f]">최근 내가 쓴 글</h3>
                  {postList(activity.posts.slice(0, 3), "아직 작성한 글이 없습니다.", deletePost)}
                </section>
                <section>
                  <h3 className="mb-3 text-lg font-black text-[#3a285f]">최근 댓글 쓴 글</h3>
                  {commentList(activity.comments.slice(0, 3), "아직 댓글 쓴 글이 없습니다.")}
                </section>
                <section>
                  <h3 className="mb-3 text-lg font-black text-[#3a285f]">최근 거래 내역</h3>
                  <MarketList items={activity.marketItems.slice(0, 3)} />
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "posts" ? postList(activity.posts, "아직 작성한 글이 없습니다.", deletePost) : null}
          {activeTab === "comments" ? commentList(activity.comments, "아직 댓글 쓴 글이 없습니다.") : null}
          {activeTab === "bookmarks" ? postList(activity.bookmarkedPosts, "아직 스크랩한 글이 없습니다.") : null}
          {activeTab === "likes" ? postList(activity.likedPosts, "아직 좋아요 누른 글이 없습니다.") : null}
          {activeTab === "goods" ? <p className="rounded-xl bg-cloud p-4 text-sm font-bold text-slate-500">찜한 굿즈 기능은 굿즈 찜 저장 API가 연결되면 이 영역에 표시됩니다.</p> : null}
          {activeTab === "market" ? <MarketList items={activity.marketItems} /> : null}
        </Card>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f2352]/30 p-4">
          <Card className="w-full max-w-lg rounded-[1.5rem] bg-white p-5">
            <h2 className="text-xl font-black text-[#3a285f]">프로필 수정</h2>
            <label className="mt-4 grid gap-2 text-sm font-black text-[#2f2352]">
              닉네임
              <input value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} className="min-h-10 rounded-xl border border-[#ead8f4] px-3 text-sm outline-none focus:border-[#b984e7]" />
            </label>
            <div className="mt-4">
              <p className="mb-2 text-sm font-black text-[#2f2352]">관심사</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-auto pr-1">
                {activity.allInterests.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setSelectedInterests((current) => (active ? current.filter((item) => item !== interest) : [...current, interest]))}
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${active ? "bg-[#ffe1ec] text-[#f05f8e]" : "bg-white text-slate-500 ring-1 ring-[#ead8f4]"}`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                저장
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function MarketList({ items }: { items: ActivityMarketItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link key={item.id} href={`/market/${item.id}`} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-2xl bg-[#fbf4ff] p-3 hover:bg-[#fff5fa]">
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-white text-[#9d6de1]">
            <HeartHandshake size={24} />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 font-black text-[#3a285f]">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {tradeTypeLabel(item.trade_type)} · {tradeStatusLabel(item.status)}
            </p>
          </div>
          <p className="text-sm font-black text-[#2f2352]">{formatPrice(item.price)}</p>
        </Link>
      ))}
      {!items.length ? <p className="rounded-xl bg-cloud p-4 text-sm font-bold text-slate-500">아직 거래 내역이 없습니다.</p> : null}
    </div>
  );
}
