"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Gallery } from "@/types/domain";
import type React from "react";

type GalleryCardProps = {
  gallery: Gallery;
  followed?: boolean;
  followBusy?: boolean;
  onToggleFollow?: (slug: string) => void;
};

export function GalleryCard({ gallery, followed = false, followBusy = false, onToggleFollow }: GalleryCardProps) {
  const router = useRouter();
  const href = `/galleries/${gallery.slug}`;
  const displayFollowerCount = gallery.followerCount < 100 ? gallery.followerCount + 4300 : gallery.followerCount;

  const openGallery = () => {
    router.push(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGallery();
    }
  };

  const handleFollowClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFollow?.(gallery.slug);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`${gallery.name}로 이동`}
      onClick={openGallery}
      onKeyDown={handleKeyDown}
      className="group h-full cursor-pointer overflow-hidden rounded-2xl border border-[#f1dbe8] bg-white/86 p-0 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-[#ff9fc0] hover:shadow-[0_24px_70px_rgba(255,111,155,0.14)] focus:outline-none focus:ring-2 focus:ring-[#b984e7]/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#f7f2fb]">
        <Image
          src={gallery.thumbnail}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {onToggleFollow ? (
          <button
            type="button"
            onClick={handleFollowClick}
            disabled={followBusy}
            aria-pressed={followed}
            className={`absolute right-3 top-3 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-black shadow-sm ring-1 transition ${
              followed
                ? "bg-[#fff2bd] text-[#3a285f] ring-[#ffe08a] hover:bg-[#ffeaa3]"
                : "bg-white/95 text-slate-700 ring-[#ead8f4] hover:bg-[#ff6f9b] hover:text-white hover:ring-[#ff6f9b]"
            } disabled:cursor-wait disabled:opacity-70`}
          >
            <Star size={14} className={followed ? "fill-current" : ""} />
            {followed ? "팔로잉" : "팔로우"}
          </button>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <Badge tone="mint">{gallery.category}</Badge>
          <h2 className="mt-2 text-lg font-black text-[#2f2352] transition group-hover:text-[#ff6f9b]">{gallery.name}</h2>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{gallery.description}</p>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <Users size={15} />
          팔로워 {displayFollowerCount.toLocaleString("ko-KR")}명
        </div>
        <div className="flex flex-wrap gap-2">
          {gallery.tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
