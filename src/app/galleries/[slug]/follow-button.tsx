"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FollowGalleryButton({ slug, initialFollowed }: { slug: string; initialFollowed: boolean }) {
  const router = useRouter();
  const [followed, setFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const response = await fetch(`/api/galleries/${slug}/follow`, { method: "POST" });
    const data = (await response.json()) as { followed?: boolean; error?: string };
    setLoading(false);
    if (response.status === 401) {
      router.push(`/login?next=/galleries/${slug}`);
      return;
    }
    if (!response.ok) {
      alert(data.error ?? "처리하지 못했습니다.");
      return;
    }
    setFollowed(Boolean(data.followed));
    router.refresh();
  }

  return (
    <Button variant={followed ? "primary" : "secondary"} onClick={toggle} disabled={loading}>
      <Star size={16} fill={followed ? "currentColor" : "none"} />
      {followed ? "자주가는 갤러리" : "자주가는 갤러리 추가"}
    </Button>
  );
}
