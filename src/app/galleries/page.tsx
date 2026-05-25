import { GalleryBrowser } from "@/app/galleries/gallery-browser";
import Image from "next/image";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import type { Gallery } from "@/types/domain";

async function getGalleries(): Promise<Gallery[]> {
  const supabase = createDataSupabaseClient();
  const { data } = await supabase
    .from("galleries")
    .select("id,name,slug,description,category,thumbnail_url,follower_count,post_count")
    .order("follower_count", { ascending: false });

  return (data ?? []).map((gallery) => ({
    id: gallery.id,
    name: gallery.name,
    slug: gallery.slug,
    description: gallery.description,
    category: gallery.category,
    thumbnail: gallery.thumbnail_url ?? "/placeholder-goods.svg",
    followerCount: gallery.follower_count ?? 0,
    postCount: gallery.post_count ?? 0,
    tags: [gallery.category].filter(Boolean)
  }));
}

export default async function GalleriesPage() {
  const galleries = await getGalleries();

  return (
    <div className="space-y-6">
      <section className="relative min-h-[15rem] overflow-hidden rounded-[2rem] border-2 border-[#ead0f4] bg-white/78 p-8 shadow-[0_18px_60px_rgba(126,80,178,0.08)] md:p-12">
        <Image src="/semoduck-gallery-hero.png" alt="" fill priority className="pointer-events-none object-cover object-right opacity-95" sizes="1536px" />
        <div className="relative max-w-xl">
          <p className="text-sm font-black text-[#ff6f9b]">갤러리</p>
          <h1 className="mt-3 text-5xl font-black leading-tight text-[#6f4ab4] md:text-6xl">갤러리</h1>
          <p className="mt-4 text-xl font-bold leading-8 text-[#44385a]">덕질 사진, 굿즈 자랑, 전시까지! 다양한 갤러리를 구경해 보세요.</p>
        </div>
      </section>
      <GalleryBrowser galleries={galleries} />
    </div>
  );
}
