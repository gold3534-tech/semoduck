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
    thumbnail: gallery.thumbnail_url ?? "/semoduck-icon.png",
    followerCount: gallery.follower_count ?? 0,
    postCount: gallery.post_count ?? 0,
    tags: [gallery.category].filter(Boolean)
  }));
}

export default async function GalleriesPage() {
  const galleries = await getGalleries();

  return (
    <div>
      <GalleryBrowser galleries={galleries} />
    </div>
  );
}
