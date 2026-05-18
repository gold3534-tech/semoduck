import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["approve", "reject"])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email || !isAdminEmail(data.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = schema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { data: submission, error: fetchError } = await admin.from("link_submissions").select("*").eq("id", id).single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "제보 링크를 찾을 수 없습니다." }, { status: 404 });
  }

  if (body.action === "approve" && submission.product_id) {
    await admin.from("product_offers").insert({
      product_id: submission.product_id,
      source: submission.source,
      mall_name: submission.source,
      price: submission.price ?? 0,
      shipping_fee: 0,
      condition: "unknown",
      is_official: submission.is_official,
      is_used: false,
      url: submission.url,
      last_checked_at: new Date().toISOString()
    });
  }

  const { error } = await admin
    .from("link_submissions")
    .update({
      status: body.action === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
