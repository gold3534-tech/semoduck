"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { GalleryCard } from "@/components/gallery-card";
import { Card } from "@/components/ui/card";
import type { Gallery } from "@/types/domain";

const categories = ["전체", "캐릭터", "게임", "애니", "웹툰", "아이돌", "버튜버"];

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
    <>
      <Card className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 focus-within:border-berry">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full outline-none"
            placeholder="굿즈, 갤러리, 게시글 검색"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`min-h-10 rounded-full px-4 text-sm font-black transition ${
                category === item ? "bg-berry text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-mint/60 hover:text-ink"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
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
    </>
  );
}
