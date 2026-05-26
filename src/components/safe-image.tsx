"use client";

import { useEffect, useMemo, useState } from "react";

type SafeImageKind = "product" | "gallery" | "profile" | "banner";

const fallbackByKind: Record<SafeImageKind, string> = {
  product: "/semoduck-icon.png",
  gallery: "/semoduck-gallery-hero.png",
  profile: "/semoduck-profile-duck.png",
  banner: "/semoduck-goods-hero.png"
};

type SafeImageProps = {
  src?: string | null;
  alt?: string;
  kind?: SafeImageKind;
  fallbackSrc?: string;
  className?: string;
  loading?: "lazy" | "eager";
};

function usableSrc(src?: string | null) {
  const value = src?.trim();
  return value && value !== "/placeholder-goods.svg" ? value : "";
}

export function SafeImage({ src, alt = "", kind = "product", fallbackSrc, className = "h-full w-full object-cover", loading = "lazy" }: SafeImageProps) {
  const fallback = fallbackSrc || fallbackByKind[kind];
  const initialSrc = useMemo(() => usableSrc(src) || fallback, [fallback, src]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
      }}
    />
  );
}
