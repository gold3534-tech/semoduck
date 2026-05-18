import { GalleryCard } from "@/components/gallery-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { galleries } from "@/lib/mock-data";

export default function GalleriesPage() {
  const categories = ["전체", "캐릭터", "게임", "애니", "웹툰", "아이돌", "버튜버"];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-berry">갤러리</p>
        <h1 className="mt-2 text-3xl font-black">팬덤별 이야기가 모이는 곳</h1>
      </div>
      <Card className="flex flex-wrap items-center gap-3">
        <input className="min-h-11 flex-1 rounded-lg border border-slate-200 px-4 outline-none focus:border-berry" placeholder="갤러리 검색" />
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <Badge key={category} tone={index === 0 ? "pink" : "gray"}>
              {category}
            </Badge>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {galleries.map((gallery) => (
          <GalleryCard key={gallery.id} gallery={gallery} />
        ))}
      </div>
    </div>
  );
}
