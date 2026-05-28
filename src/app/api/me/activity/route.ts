import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminSupabaseClient>;
  try {
    admin = createAdminSupabaseClient();
  } catch {
    return NextResponse.json({ error: "서버 설정을 확인해 주세요. 관리자 키가 누락되었습니다." }, { status: 500 });
  }
  const fallbackProfile = {
    id: user.id,
    email: user.email ?? null,
    nickname: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "세모덕 유저",
    profile_image: user.user_metadata?.avatar_url ?? null
  };
  await admin.from("profiles").upsert(fallbackProfile, { onConflict: "id", ignoreDuplicates: true });

  const [profileResult, postsResult, commentsResult, marketResult, likedResult, bookmarkedResult, interestsResult, allInterestsResult, followedResult] = await Promise.all([
    admin.from("profiles").select("id,email,nickname,role").eq("id", user.id).single(),
    admin
      .from("posts")
      .select("id,title,post_type,created_at,like_count,comment_count,bookmark_count,galleries(name,slug)")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    admin
      .from("comments")
      .select("id,content,created_at,posts(id,title,post_type,created_at,like_count,comment_count,bookmark_count,galleries(name,slug))")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    admin
      .from("market_items")
      .select("id,title,trade_type,status,price,created_at,galleries(name,slug)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("post_reactions")
      .select("created_at,posts(id,title,post_type,created_at,like_count,comment_count,bookmark_count,profiles(nickname),galleries(name,slug))")
      .eq("user_id", user.id)
      .eq("type", "like")
      .order("created_at", { ascending: false }),
    admin
      .from("post_reactions")
      .select("created_at,posts(id,title,post_type,created_at,like_count,comment_count,bookmark_count,profiles(nickname),galleries(name,slug))")
      .eq("user_id", user.id)
      .eq("type", "bookmark")
      .order("created_at", { ascending: false }),
    admin.from("user_interests").select("interests(name)").eq("user_id", user.id),
    admin.from("interests").select("name").order("name"),
    admin.from("gallery_follows").select("galleries(id,name,slug,category,thumbnail_url)").eq("user_id", user.id)
  ]);

  if (profileResult.error) {
    return NextResponse.json(
      {
        profile: { ...fallbackProfile, role: "user" },
        posts: [],
        comments: [],
        marketItems: [],
        likedPosts: [],
        bookmarkedPosts: [],
        interests: [],
        allInterests: (allInterestsResult.data ?? []).map((row) => row.name),
        followedGalleries: [],
        counts: { posts: 0, comments: 0, bookmarks: 0, likes: 0, marketItems: 0 }
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    profile: profileResult.data,
    posts: postsResult.data ?? [],
    comments: commentsResult.data ?? [],
    marketItems: marketResult.data ?? [],
    likedPosts: (likedResult.data ?? []).map((row) => row.posts).filter(Boolean),
    bookmarkedPosts: (bookmarkedResult.data ?? []).map((row) => row.posts).filter(Boolean),
    interests: ((interestsResult.data ?? []) as Array<{ interests?: { name?: string } | Array<{ name?: string }> | null }>)
      .map((row) => (Array.isArray(row.interests) ? row.interests[0]?.name : row.interests?.name))
      .filter(Boolean),
    allInterests: (allInterestsResult.data ?? []).map((row) => row.name),
    followedGalleries: ((followedResult.data ?? []) as Array<{ galleries?: unknown }>).map((row) => row.galleries).filter(Boolean),
    counts: {
      posts: postsResult.data?.length ?? 0,
      comments: commentsResult.data?.length ?? 0,
      bookmarks: bookmarkedResult.data?.length ?? 0,
      likes: likedResult.data?.length ?? 0,
      marketItems: marketResult.data?.length ?? 0
    }
  });
}
