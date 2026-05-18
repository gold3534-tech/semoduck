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
      className="group h-full cursor-pointer overflow-hidden rounded-lg border border-slate-100 bg-white p-0 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-berry/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-berry/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
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
                ? "bg-sun text-ink ring-sun/70 hover:bg-sun/90"
                : "bg-white/95 text-slate-700 ring-slate-200 hover:bg-berry hover:text-white hover:ring-berry"
            } disabled:cursor-wait disabled:opacity-70`}
          >
            <Star size={14} className={followed ? "fill-current" : ""} />
            {followed ? "자주가는" : "추가"}
          </button>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <Badge tone="mint">{gallery.category}</Badge>
          <h2 className="mt-2 text-lg font-black text-ink transition group-hover:text-berry">{gallery.name}</h2>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{gallery.description}</p>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <Users size={15} />
          팔로워 {gallery.followerCount.toLocaleString("ko-KR")}명
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
