"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Grid3X3, MonitorPlay, Search, Sparkles, Star, Tv, Users } from "lucide-react";
import { GalleryCard } from "@/components/gallery-card";
import { Card } from "@/components/ui/card";
import type { Gallery } from "@/types/domain";

const categories = ["전체", "캐릭터", "게임", "애니", "웹툰", "아이돌", "버튜버"];
const categoryIcons = [Grid3X3, Star, Gamepad2, Tv, MonitorPlay, Sparkles, Users];

type ActivityResponse = {
  followedGalleries?: Array<{ slug?: string | null } | null>;
};

export function GalleryBrowser({ galleries }: { galleries: Gallery[] }) {
  const router = useRouter();
  const [items, setItems] = useState(galleries);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [followedSlugs, setFollowedSlugs] = useState<Set<string>>(new Set());
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadFollowedGalleries() {
      try {
        const response = await fetch("/api/me/activity", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ActivityResponse;
        if (!alive) return;
        setFollowedSlugs(new Set((data.followedGalleries ?? []).map((gallery) => gallery?.slug).filter(Boolean) as string[]));
      } catch {
        if (alive) setFollowedSlugs(new Set());
      }
    }

    loadFollowedGalleries();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items
      .filter((gallery) => {
        const matchesQuery =
          !normalized ||
          gallery.name.toLowerCase().includes(normalized) ||
          gallery.description.toLowerCase().includes(normalized) ||
          gallery.tags.some((tag) => tag.toLowerCase().includes(normalized));
        const matchesCategory = category === "전체" || gallery.category === category;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        const aFollowed = followedSlugs.has(a.slug) ? 1 : 0;
        const bFollowed = followedSlugs.has(b.slug) ? 1 : 0;
        if (aFollowed !== bFollowed) return bFollowed - aFollowed;
        return b.followerCount - a.followerCount;
      });
  }, [category, followedSlugs, items, query]);

  const toggleFollow = async (slug: string) => {
    setBusySlug(slug);
    try {
      const response = await fetch(`/api/galleries/${slug}/follow`, { method: "POST" });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/galleries")}`);
        return;
      }
      if (!response.ok) return;

      const data = (await response.json()) as { followed?: boolean; followerCount?: number };
      setFollowedSlugs((current) => {
        const next = new Set(current);
        if (data.followed) next.add(slug);
        else next.delete(slug);
        return next;
      });
      if (typeof data.followerCount === "number") {
        setItems((current) => current.map((gallery) => (gallery.slug === slug ? { ...gallery, followerCount: data.followerCount ?? gallery.followerCount } : gallery)));
      }
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <aside className="space-y-4">
        <Card className="grid gap-2 p-4">
          {categories.map((item, index) => {
            const Icon = categoryIcons[index] ?? Grid3X3;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition ${
                  category === item ? "bg-[#ffeaf1] text-[#f15f91]" : "text-[#4b3a6d] hover:bg-[#fff4fa]"
                }`}
              >
                <Icon size={18} />
                {item}
              </button>
            );
          })}
        </Card>
        <Card className="bg-gradient-to-br from-[#fff8fb] to-[#fff1f7]">
          <p className="font-black text-[#6f4ab4]">갤러리 제안</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">원하는 공간이 없다면 건의함에서 관리자에게 알려주세요.</p>
        </Card>
      </aside>
      <div className="space-y-5">
      <Card className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex min-h-12 items-center gap-2 rounded-full border border-[#ead8f4] bg-white px-5 focus-within:border-[#b984e7]">
          <Search size={18} className="text-[#8b61c8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent font-bold outline-none"
            placeholder="굿즈, 갤러리, 게시글 검색"
          />
        </div>
        <p className="self-center text-sm font-black text-slate-500">{filtered.length.toLocaleString("ko-KR")}개 갤러리</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((gallery) => (
          <GalleryCard
            key={gallery.id}
            gallery={gallery}
            followed={followedSlugs.has(gallery.slug)}
            followBusy={busySlug === gallery.slug}
            onToggleFollow={toggleFollow}
          />
        ))}
      </div>
      </div>
    </div>
  );
}
