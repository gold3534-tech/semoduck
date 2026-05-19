import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  content: z.string().min(2)
});

async function requireOwner(id: string) {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = data.user;
  if (!user) return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };

  const admin = createAdminSupabaseClient();
  const { data: inquiry } = await admin.from("market_inquiries").select("user_id").eq("id", id).single();
  if (inquiry?.user_id !== user.id) return { error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };

  return { admin };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await requireOwner(id);
  if (owner.error) return owner.error;

  const body = updateSchema.parse(await request.json());
  const { error } = await owner.admin.from("market_inquiries").update({ content: body.content, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await requireOwner(id);
  if (owner.error) return owner.error;

  const { error } = await owner.admin.from("market_inquiries").update({ is_deleted: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
