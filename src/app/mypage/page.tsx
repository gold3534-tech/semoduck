import { Bookmark, Heart, Medal, MessageCircle, PenLine, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { galleries, interests, marketItems, posts, products } from "@/lib/mock-data";
import type { LucideIcon } from "lucide-react";

export default function MyPage() {
  const stats: Array<[string, number, LucideIcon]> = [
    ["내가 쓴 글", posts.length, PenLine],
    ["내가 쓴 댓글", 12, MessageCircle],
    ["북마크한 글", 8, Bookmark],
    ["찜한 굿즈", products.length, Heart]
  ];

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-ink text-white">
            <UserRound size={28} />
          </div>
          <div>
            <p className="text-sm font-black text-berry">마이페이지</p>
            <h1 className="text-2xl font-black">덕심가득</h1>
            <p className="text-sm font-bold text-slate-500">user@semoduck.dev</p>
          </div>
        </div>
        <Badge tone="mint">role: user</Badge>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={String(label)}>
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
              <Badge key={interest} tone="pink">{interest}</Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">팔로우한 갤러리</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {galleries.slice(0, 4).map((gallery) => (
              <Badge key={gallery.id} tone="mint">{gallery.name}</Badge>
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
              <p key={item.id} className="rounded-lg bg-cloud p-3 font-bold text-slate-700">{item.title}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
