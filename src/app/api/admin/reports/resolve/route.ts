import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["post", "market_item", "product"]),
  targetId: z.string().uuid(),
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

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const body = schema.parse(await request.json());
  const status = body.action === "dismiss" ? "dismissed" : "accepted";
  const { error } = await session.admin
    .from("reports")
    .update({ status, resolved_by: session.userId, resolved_at: new Date().toISOString() })
    .eq("target_type", body.targetType)
    .eq("target_id", body.targetId)
    .eq("status", "pending");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.action === "delete") {
    if (body.targetType === "post") await session.admin.from("posts").update({ is_deleted: true, report_count: 0 }).eq("id", body.targetId);
    if (body.targetType === "market_item") await session.admin.from("market_items").update({ status: "reported", report_count: 0 }).eq("id", body.targetId);
    if (body.targetType === "product") await session.admin.from("products").update({ is_deleted: true, report_count: 0 }).eq("id", body.targetId);
  } else {
    if (body.targetType === "post") await session.admin.from("posts").update({ report_count: 0 }).eq("id", body.targetId);
    if (body.targetType === "market_item") await session.admin.from("market_items").update({ report_count: 0 }).eq("id", body.targetId);
    if (body.targetType === "product") await session.admin.from("products").update({ report_count: 0 }).eq("id", body.targetId);
  }

  return NextResponse.json({ ok: true });
}
