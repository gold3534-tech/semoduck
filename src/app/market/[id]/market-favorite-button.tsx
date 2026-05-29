"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

type MarketFavoriteMeta = {
  id: string;
  title: string;
  image?: string | null;
  price: number;
  tradeType: string;
  href: string;
  galleryName?: string | null;
};

export function MarketFavoriteButton({
  marketItemId,
  isLoggedIn,
  loginNext,
  item,
}: {
  marketItemId: string;
  isLoggedIn: boolean;
  loginNext: string;
  item: Omit<MarketFavoriteMeta, "id" | "href">;
}) {
  const router = useRouter();
  const storageKey = `semoduck:favorite-market:${marketItemId}`;
  const metaKey = `semoduck:favorite-market-meta:${marketItemId}`;
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(window.localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }

    const next = !favorited;
    setFavorited(next);

    if (next) {
      window.localStorage.setItem(storageKey, "1");
      window.localStorage.setItem(
        metaKey,
        JSON.stringify({
          id: marketItemId,
          href: `/market/${marketItemId}`,
          ...item,
        })
      );
    } else {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(metaKey);
    }

    window.dispatchEvent(new Event("semoduck:favorite-market-changed"));
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={toggle}
      className={`min-h-9 rounded-xl px-4 py-1.5 text-xs ${
        favorited ? "text-[#ff5f8d] ring-[#ffc6d8]" : ""
      }`}
    >
      <Heart size={15} fill={favorited ? "currentColor" : "none"} />
      {favorited ? "찜 완료" : "찜하기"}
    </Button>
  );
}