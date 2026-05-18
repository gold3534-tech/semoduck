import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  content: z.string().min(1)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = updateSchema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { data: comment } = await admin.from("comments").select("user_id").eq("id", id).single();
  if (comment?.user_id !== user.id) return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });

  const { error } = await admin.from("comments").update({ content: body.content, updated_at: new Date().toISOString() }).eq("id", id);
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
  const { data: comment } = await admin.from("comments").select("user_id,post_id").eq("id", id).single();
  if (comment?.user_id !== user.id) return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });

  const { error } = await admin.from("comments").update({ is_deleted: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (comment?.post_id) {
    const { data: current } = await admin.from("posts").select("comment_count").eq("id", comment.post_id).single();
    await admin.from("posts").update({ comment_count: Math.max(0, Number(current?.comment_count ?? 0) - 1) }).eq("id", comment.post_id);
  }

  return NextResponse.json({ ok: true });
}
