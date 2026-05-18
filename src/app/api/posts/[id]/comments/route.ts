import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  content: z.string().min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const admin = createAdminSupabaseClient();

  const { data: comment, error } = await admin
    .from("comments")
    .insert({
      post_id: id,
      user_id: user.id,
      content: body.content,
      like_count: 0,
      is_deleted: false
    })
    .select("id,content,like_count,created_at,profiles(nickname,email)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.rpc("increment_post_comment_count", { target_post_id: id }).then(async ({ error: rpcError }) => {
    if (rpcError) {
      const { data: current } = await admin.from("posts").select("comment_count").eq("id", id).single();
      await admin
        .from("posts")
        .update({ comment_count: Number(current?.comment_count ?? 0) + 1 })
        .eq("id", id);
    }
  });

  return NextResponse.json({ comment });
}
