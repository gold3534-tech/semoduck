import { GalleryBrowser } from "@/app/galleries/gallery-browser";
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
      <div>
        <p className="text-sm font-black text-berry">갤러리</p>
        <h1 className="mt-2 text-3xl font-black">좋아하는 장르와 굿즈 이야기를 모아봐요</h1>
      </div>
      <GalleryBrowser galleries={galleries} />
    </div>
  );
}
