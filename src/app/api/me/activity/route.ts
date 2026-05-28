import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;

  if (!user || !authClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminSupabaseClient> | null = null;
  try {
    admin = createAdminSupabaseClient();
  } catch {
    admin = null;
  }

  const db = admin ?? authClient;
  const fallbackProfile = {
    id: user.id,
    email: user.email ?? null,
    nickname: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "세모덕 유저",
    profile_image: user.user_metadata?.avatar_url ?? null,
    role: "user"
  };

  if (admin) {
    await admin.from("profiles").upsert(
      {
        id: fallbackProfile.id,
        email: fallbackProfile.email,
        nickname: fallbackProfile.nickname,
        profile_image: fallbackProfile.profile_image
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  const [profileResult, postsResult, commentsResult, marketResult, likedResult, bookmarkedResult, interestsResult, allInterestsResult, followedResult] = await Promise.all([
    db.from("profiles").select("id,email,nickname,role").eq("id", user.id).maybeSingle(),
    db
      .from("posts")
      .select("id,title,post_type,created_at,like_count,comment_count,bookmark_count,galleries(name,slug)")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    db
      .from("comments")
      .select("id,content,created_at,posts(id,title,post_type,created_at,like_count,comment_count,bookmark_count,galleries(name,slug))")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    db
      .from("market_items")
      .select("id,title,trade_type,status,price,created_at,galleries(name,slug)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    db
      .from("post_reactions")
      .select("created_at,posts(id,title,post_type,created_at,like_count,comment_count,bookmark_count,profiles(nickname),galleries(name,slug))")
      .eq("user_id", user.id)
      .eq("type", "like")
      .order("created_at", { ascending: false }),
    db
      .from("post_reactions")
      .select("created_at,posts(id,title,post_type,created_at,like_count,comment_count,bookmark_count,profiles(nickname),galleries(name,slug))")
      .eq("user_id", user.id)
      .eq("type", "bookmark")
      .order("created_at", { ascending: false }),
    db.from("user_interests").select("interests(name)").eq("user_id", user.id),
    db.from("interests").select("name").order("name"),
    db.from("gallery_follows").select("galleries(id,name,slug,category,thumbnail_url)").eq("user_id", user.id)
  ]);

  const interests = ((interestsResult.data ?? []) as Array<{ interests?: { name?: string } | Array<{ name?: string }> | null }>)
    .map((row) => (Array.isArray(row.interests) ? row.interests[0]?.name : row.interests?.name))
    .filter(Boolean);

  const likedPosts = ((likedResult.data ?? []) as Array<{ posts?: unknown }>).map((row) => row.posts).filter(Boolean);
  const bookmarkedPosts = ((bookmarkedResult.data ?? []) as Array<{ posts?: unknown }>).map((row) => row.posts).filter(Boolean);
  const followedGalleries = ((followedResult.data ?? []) as Array<{ galleries?: unknown }>).map((row) => row.galleries).filter(Boolean);

  return NextResponse.json({
    profile: profileResult.data ?? fallbackProfile,
    posts: postsResult.data ?? [],
    comments: commentsResult.data ?? [],
    marketItems: marketResult.data ?? [],
    likedPosts,
    bookmarkedPosts,
    interests,
    allInterests: (allInterestsResult.data ?? []).map((row) => row.name),
    followedGalleries,
    counts: {
      posts: postsResult.data?.length ?? 0,
      comments: commentsResult.data?.length ?? 0,
      bookmarks: bookmarkedPosts.length,
      likes: likedPosts.length,
      marketItems: marketResult.data?.length ?? 0
    }
  });
}
