"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";

type LikedProductMeta = {
  id: string;
  title?: string;
  image?: string;
  href?: string;
  price?: number;
  mallName?: string;
};

export function ProductLikeButton({
  productId,
  initialCount = 0,
  compact = false,
  product
}: {
  productId: string;
  initialCount?: number;
  compact?: boolean;
  product?: Omit<LikedProductMeta, "id">;
}) {
  const storageKey = `semoduck:liked-product:${productId}`;
  const metaKey = `semoduck:liked-product-meta:${productId}`;
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setLiked(window.localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setLiked((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "1" : "0");
      if (next) {
        window.localStorage.setItem(metaKey, JSON.stringify({ id: productId, ...product }));
      } else {
        window.localStorage.removeItem(metaKey);
      }
      window.dispatchEvent(new Event("semoduck:liked-products-changed"));
      setCount((value) => Math.max(0, value + (next ? 1 : -1)));
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      className={`inline-flex items-center justify-center gap-1 rounded-full bg-white/95 font-black text-[#ff6f9b] shadow-sm ring-1 ring-[#f4dbe7] transition hover:bg-[#fff1f7] ${
        compact ? "h-8 w-8 text-xs" : "min-h-9 px-3 text-xs"
      }`}
    >
      <Heart size={compact ? 15 : 16} className={liked ? "fill-current" : ""} />
      {compact ? null : count}
    </button>
  );
}
