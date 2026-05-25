"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Gallery } from "@/types/domain";
import type React from "react";

type GalleryCardProps = {
  gallery: Gallery;
  compact?: boolean;
  rank?: number;
  followed?: boolean;
  followBusy?: boolean;
  onToggleFollow?: (slug: string) => void;
};

export function GalleryCard({ gallery, compact = false, rank, followed = false, followBusy = false, onToggleFollow }: GalleryCardProps) {
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
      className={
        compact
          ? "group grid h-full cursor-pointer grid-cols-[5.25rem_1fr] gap-3 rounded-2xl border border-[#f1dbe8] bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-[#ff9fc0] focus:outline-none focus:ring-2 focus:ring-[#b984e7]/40"
          : "group h-full cursor-pointer overflow-hidden rounded-2xl border border-[#f1dbe8] bg-white/90 p-0 shadow-soft transition hover:-translate-y-0.5 hover:border-[#ff9fc0] focus:outline-none focus:ring-2 focus:ring-[#b984e7]/40"
      }
    >
      <div className={compact ? "relative aspect-square overflow-hidden rounded-2xl bg-[#f7f2fb]" : "relative aspect-[16/9] overflow-hidden bg-[#f7f2fb]"}>
        <Image src={gallery.thumbnail} alt="" fill className="object-cover transition duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 35vw, 220px" />
        {rank ? <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#fff2bd] text-[11px] font-black text-[#c47b00]">{rank}</span> : null}
      </div>

      <div className={compact ? "min-w-0 space-y-1.5" : "space-y-2 p-3"}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Badge tone="mint">{gallery.category}</Badge>
            <h2 className="mt-1 line-clamp-1 text-base font-black text-[#2f2352] transition group-hover:text-[#ff6f9b]">{gallery.name}</h2>
          </div>
          {onToggleFollow ? (
            <button
              type="button"
              onClick={handleFollowClick}
              disabled={followBusy}
              aria-pressed={followed}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 transition ${
                followed ? "bg-[#fff2bd] text-[#3a285f] ring-[#ffe08a]" : "bg-white text-[#6f4ab4] ring-[#ead8f4] hover:bg-[#fff1f7]"
              } disabled:cursor-wait disabled:opacity-70`}
            >
              <Star size={12} className={`mr-1 inline ${followed ? "fill-current" : ""}`} />
              {followed ? "팔로잉" : "팔로우"}
            </button>
          ) : null}
        </div>
        {!compact ? <p className="line-clamp-2 text-xs leading-5 text-slate-600">{gallery.description}</p> : null}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Users size={13} />
          팔로워 {displayFollowerCount.toLocaleString("ko-KR")}명
        </div>
        <div className="flex flex-wrap gap-1.5">
          {gallery.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
