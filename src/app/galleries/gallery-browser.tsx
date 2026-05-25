"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
    <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
      <aside className="space-y-3">
        <Card className="grid gap-1.5 p-3">
          {categories.map((item, index) => {
            const Icon = categoryIcons[index] ?? Grid3X3;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex min-h-10 items-center gap-2 rounded-2xl px-3 text-xs font-black transition ${
                  category === item ? "bg-[#ffeaf1] text-[#f15f91]" : "text-[#4b3a6d] hover:bg-[#fff4fa]"
                }`}
              >
                <Icon size={18} />
                {item}
              </button>
            );
          })}
        </Card>
        <Card className="bg-gradient-to-br from-[#fff8fb] to-[#fff1f7] p-3">
          <p className="text-sm font-black text-[#6f4ab4]">갤러리를 만들고</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">나만의 덕질 공간을 꾸며보세요.</p>
          <Link href="/suggestions" className="mt-3 inline-flex h-9 items-center rounded-2xl bg-white px-3 text-xs font-black text-[#6f4ab4] ring-1 ring-[#ead8f4]">
            갤러리 만들기 +
          </Link>
        </Card>
      </aside>
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-[#ead0f4] bg-white/82 p-4 shadow-[0_12px_34px_rgba(126,80,178,0.06)]">
          <Image src="/semoduck-gallery-hero.png" alt="" fill priority className="pointer-events-none object-cover object-right opacity-90" sizes="1024px" />
          <div className="relative max-w-md">
            <h1 className="text-3xl font-black text-[#6f4ab4]">갤러리</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-[#44385a]">덕질 사진, 굿즈 자랑, 전시까지 다양한 갤러리를 구경해 보세요.</p>
          </div>
        </section>

      <Card className="grid gap-3 p-3 md:grid-cols-[1fr_auto]">
        <div className="flex min-h-10 items-center gap-2 rounded-full border border-[#ead8f4] bg-white px-4 focus-within:border-[#b984e7]">
          <Search size={18} className="text-[#8b61c8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm font-bold outline-none"
            placeholder={`${category === "전체" ? "갤러리" : category} 검색`}
          />
        </div>
        <p className="self-center text-sm font-black text-slate-500">{filtered.length.toLocaleString("ko-KR")}개 갤러리</p>
      </Card>

        <Card className="p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#3a285f]">{category === "전체" ? "인기 갤러리" : `${category} 갤러리`}</h2>
            <span className="text-xs font-black text-[#6f4ab4]">더보기 ›</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, category === "전체" && !query ? 8 : filtered.length).map((gallery, index) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                rank={index + 1}
                compact={category !== "전체" || Boolean(query)}
                followed={followedSlugs.has(gallery.slug)}
                followBusy={busySlug === gallery.slug}
                onToggleFollow={toggleFollow}
              />
            ))}
          </div>
        </Card>

        {category === "전체" && !query ? (
          <Card className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#3a285f]">새로 생긴 갤러리 <span className="rounded-full bg-[#ff6f9b] px-2 py-1 text-xs text-white">NEW</span></h2>
              <span className="text-xs font-black text-[#6f4ab4]">더보기 ›</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {items.slice(-4).map((gallery) => (
                <GalleryCard key={`new-${gallery.id}`} gallery={gallery} compact followed={followedSlugs.has(gallery.slug)} followBusy={busySlug === gallery.slug} onToggleFollow={toggleFollow} />
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
