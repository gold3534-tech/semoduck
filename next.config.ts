import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "shopping-phinf.pstatic.net" },
      { protocol: "https", hostname: "estar-egg.com" },
      { protocol: "https", hostname: "aniland1.cafe24.com" },
      { protocol: "http", hostname: "image.toast.com" },
      { protocol: "https", hostname: "image.toast.com" },
      { protocol: "https", hostname: "*.cdn-nhncommerce.com" },
      { protocol: "https", hostname: "shopby-images.cdn-nhncommerce.com" },
      { protocol: "https", hostname: "*.supabase.co" }
    ]
  }
};

export default nextConfig;
