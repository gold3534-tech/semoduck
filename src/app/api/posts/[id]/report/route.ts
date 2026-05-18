import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const AUTO_DELETE_REPORTS = 5;

const schema = z.object({
  category: z.string().min(1, "신고 종류를 선택해주세요."),
  detail: z.string().min(5, "신고 내용을 5자 이상 적어주세요.")
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

  const { data: existing } = await admin
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", "post")
    .eq("target_id", id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 신고한 게시물입니다." }, { status: 409 });
  }

  const reason = `${body.category}: ${body.detail}`;
  const fullInsert = await admin.from("reports").insert({
    reporter_id: user.id,
    target_type: "post",
    target_id: id,
    category: body.category,
    detail: body.detail,
    reason,
    status: "pending"
  });

  if (fullInsert.error) {
    const schemaCacheMiss =
      fullInsert.error.message.includes("category") ||
      fullInsert.error.message.includes("detail") ||
      fullInsert.error.message.includes("schema cache");

    if (!schemaCacheMiss) {
      return NextResponse.json({ error: fullInsert.error.message }, { status: 500 });
    }

    const fallbackInsert = await admin.from("reports").insert({
      reporter_id: user.id,
      target_type: "post",
      target_id: id,
      reason,
      status: "pending"
    });

    if (fallbackInsert.error) {
      return NextResponse.json({ error: fallbackInsert.error.message }, { status: 500 });
    }
  }

  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "post")
    .eq("target_id", id)
    .eq("status", "pending");

  const reportCount = count ?? 1;
  const update = await admin
    .from("posts")
    .update({
      report_count: reportCount,
      is_deleted: reportCount >= AUTO_DELETE_REPORTS,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (update.error && update.error.message.includes("report_count")) {
    await admin
      .from("posts")
      .update({
        is_deleted: reportCount >= AUTO_DELETE_REPORTS,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true, reportCount, autoDeleted: reportCount >= AUTO_DELETE_REPORTS });
}
