"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, Loader2, Medal, MessageCircle, PenLine, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/auth";
import { galleries, interests, marketItems, posts, products } from "@/lib/mock-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type UserProfile = {
  email: string;
  nickname: string;
  role: "admin" | "user";
};

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user?.email) {
        router.replace("/login?next=/mypage");
        return;
      }

      setProfile({
        email: user.email,
        nickname: user.user_metadata?.name || user.email.split("@")[0],
        role: isAdminEmail(user.email) ? "admin" : "user"
      });
      setLoading(false);
    });
  }, [router]);

  const stats: Array<[string, number, LucideIcon]> = [
    ["내가 쓴 글", posts.length, PenLine],
    ["내가 쓴 댓글", 12, MessageCircle],
    ["북마크한 글", 8, Bookmark],
    ["찜한 굿즈", products.length, Heart]
  ];

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <Loader2 className="animate-spin text-berry" size={32} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-ink text-white">
            <UserRound size={28} />
          </div>
          <div>
            <p className="text-sm font-black text-berry">마이페이지</p>
            <h1 className="text-2xl font-black">{profile.nickname}</h1>
            <p className="text-sm font-bold text-slate-500">{profile.email}</p>
          </div>
        </div>
        <Badge tone={profile.role === "admin" ? "pink" : "mint"}>role: {profile.role}</Badge>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={label}>
            <Icon size={20} className="text-berry" />
            <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black">{String(value)}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-black">관심사</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.slice(0, 8).map((interest) => (
              <Badge key={interest} tone="pink">
                {interest}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">팔로우한 갤러리</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {galleries.slice(0, 4).map((gallery) => (
              <Badge key={gallery.id} tone="mint">
                {gallery.name}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">활동 배지</h2>
          <div className="mt-3 grid gap-2">
            {["첫 게시글 작성", "첫 댓글 작성", "인기글 선정", "굿즈 10개 찜"].map((badge) => (
              <p key={badge} className="flex items-center gap-2 rounded-lg bg-cloud p-3 font-bold text-slate-700">
                <Medal size={16} className="text-amber-500" />
                {badge}
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">내 교환/양도/중고 글</h2>
          <div className="mt-3 space-y-2">
            {marketItems.map((item) => (
              <p key={item.id} className="rounded-lg bg-cloud p-3 font-bold text-slate-700">
                {item.title}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
