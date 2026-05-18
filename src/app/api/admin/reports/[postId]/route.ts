import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["dismiss", "delete"])
});

async function requireAdmin() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email || !isAdminEmail(data.user.email)) {
    return { error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }
  return { admin: createAdminSupabaseClient(), userId: data.user.id };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const session = await requireAdmin();
  if (session.error) return session.error;

  const body = schema.parse(await request.json());
  const status = body.action === "dismiss" ? "dismissed" : "accepted";

  const { error: reportError } = await session.admin
    .from("reports")
    .update({ status, resolved_by: session.userId, resolved_at: new Date().toISOString() })
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("status", "pending");

  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 });

  const { error: postError } = await session.admin
    .from("posts")
    .update({ is_deleted: body.action === "delete", report_count: 0, updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
