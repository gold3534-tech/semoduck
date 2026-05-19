import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["post", "market_item", "product"]),
  targetId: z.string().uuid(),
  category: z.string().min(1),
  detail: z.string().min(5)
});

const tableByType = {
  post: "posts",
  market_item: "market_items",
  product: "products"
} as const;

export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;

  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = schema.parse(await request.json());
  const admin = createAdminSupabaseClient();

  const { data: existing } = await admin
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", body.targetType)
    .eq("target_id", body.targetId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "이미 신고한 대상입니다." }, { status: 409 });

  const reason = `${body.category}: ${body.detail}`;
  const { error } = await admin.from("reports").insert({
    reporter_id: user.id,
    target_type: body.targetType,
    target_id: body.targetId,
    category: body.category,
    detail: body.detail,
    reason,
    status: "pending"
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", body.targetType)
    .eq("target_id", body.targetId)
    .eq("status", "pending");

  const reportCount = count ?? 1;
  const table = tableByType[body.targetType];
  const updatePayload: Record<string, unknown> = { report_count: reportCount, updated_at: new Date().toISOString() };
  if (body.targetType === "post" && reportCount >= 5) updatePayload.is_deleted = true;
  if (body.targetType === "market_item" && reportCount >= 5) updatePayload.status = "reported";
  if (body.targetType === "product" && reportCount >= 5) updatePayload.is_deleted = true;
  await admin.from(table).update(updatePayload).eq("id", body.targetId);

  return NextResponse.json({ ok: true, reportCount });
}
