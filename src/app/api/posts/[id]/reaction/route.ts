import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  type: z.enum(["like", "bookmark"])
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

  const { data: existing, error: existingError } = await admin
    .from("post_reactions")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .eq("type", body.type)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const column = body.type === "like" ? "like_count" : "bookmark_count";
  const { data: current } = await admin.from("posts").select("like_count,bookmark_count").eq("id", id).single();
  const currentCount = Number((current as Record<string, unknown> | null)?.[column] ?? 0);

  if (existing) {
    const { error } = await admin.from("post_reactions").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("posts").update({ [column]: Math.max(0, currentCount - 1) }).eq("id", id);
    return NextResponse.json({ active: false, count: Math.max(0, currentCount - 1) });
  }

  const { error } = await admin.from("post_reactions").insert({ post_id: id, user_id: user.id, type: body.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("posts").update({ [column]: currentCount + 1 }).eq("id", id);
  return NextResponse.json({ active: true, count: currentCount + 1 });
}
