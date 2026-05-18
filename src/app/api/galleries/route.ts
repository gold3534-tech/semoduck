import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("galleries")
    .select("id,name,slug,description,category,thumbnail_url,follower_count,post_count")
    .order("follower_count", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    galleries: (data ?? []).map((gallery) => ({
      id: gallery.id,
      name: gallery.name,
      slug: gallery.slug,
      description: gallery.description,
      category: gallery.category,
      thumbnail: gallery.thumbnail_url ?? "/placeholder-goods.svg",
      followerCount: gallery.follower_count ?? 0,
      postCount: gallery.post_count ?? 0,
      tags: [gallery.category].filter(Boolean)
    }))
  });
}
