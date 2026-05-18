import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Gallery } from "@/types/domain";

export function GalleryCard({ gallery }: { gallery: Gallery }) {
  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-slate-100">
        <Image src={gallery.thumbnail} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <Badge tone="mint">{gallery.category}</Badge>
          <Link href={`/galleries/${gallery.slug}`} className="mt-2 block text-lg font-black text-ink hover:text-berry">
            {gallery.name}
          </Link>
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
    </Card>
  );
}
