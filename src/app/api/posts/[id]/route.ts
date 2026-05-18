import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().min(2).optional()
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const [postResult, commentsResult, tagsResult] = await Promise.all([
    admin
      .from("posts")
      .select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,image_url,profiles(nickname,email),galleries(name,slug)")
      .eq("id", id)
      .eq("is_deleted", false)
      .single(),
    admin
      .from("comments")
      .select("id,content,like_count,created_at,profiles(nickname,email)")
      .eq("post_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
    admin.from("post_tags").select("tags(name)").eq("post_id", id)
  ]);

  if (postResult.error) {
    return NextResponse.json({ error: postResult.error.message }, { status: 404 });
  }

  return NextResponse.json({
    post: postResult.data,
    comments: commentsResult.data ?? [],
    tags: ((tagsResult.data ?? []) as Array<{ tags?: { name?: string } | Array<{ name?: string }> | null }>)
      .map((row) => (Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name))
      .filter(Boolean)
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = updateSchema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { data: post } = await admin.from("posts").select("user_id").eq("id", id).single();
  if (post?.user_id !== user.id) return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });

  const { error } = await admin.from("posts").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: post } = await admin.from("posts").select("user_id").eq("id", id).single();
  if (post?.user_id !== user.id) return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });

  const { error } = await admin.from("posts").update({ is_deleted: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
