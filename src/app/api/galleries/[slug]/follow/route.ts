import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data: gallery } = await admin.from("galleries").select("id").eq("slug", slug).single();

  if (!gallery) {
    return NextResponse.json({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: existing } = await admin.from("gallery_follows").select("id").eq("gallery_id", gallery.id).eq("user_id", user.id).maybeSingle();

  if (existing) {
    await admin.from("gallery_follows").delete().eq("id", existing.id);
    await admin.rpc("recalculate_gallery_follower_count", { target_gallery_id: gallery.id });
    const { data: updatedGallery } = await admin.from("galleries").select("follower_count").eq("id", gallery.id).single();
    return NextResponse.json({ followed: false, followerCount: updatedGallery?.follower_count ?? 0 });
  }

  const { error } = await admin.from("gallery_follows").insert({ gallery_id: gallery.id, user_id: user.id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await admin.rpc("recalculate_gallery_follower_count", { target_gallery_id: gallery.id });
  const { data: updatedGallery } = await admin.from("galleries").select("follower_count").eq("id", gallery.id).single();

  return NextResponse.json({ followed: true, followerCount: updatedGallery?.follower_count ?? 0 });
}
