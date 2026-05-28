import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const suggestionSchema = z.object({
  type: z.enum(["gallery_request", "feature_request", "bug_report", "other"]).default("gallery_request"),
  title: z.string().min(2, "제목을 2글자 이상 입력해주세요."),
  detail: z.string().min(5, "내용을 5글자 이상 입력해주세요."),
  galleryName: z.string().optional().default(""),
  galleryCategory: z.string().optional().default("")
});

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `gallery-${Date.now()}`;
}

export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 내용을 읽지 못했습니다. 다시 시도해 주세요." }, { status: 400 });
  }

  const parsed = suggestionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }

  const body = parsed.data;
  let admin: ReturnType<typeof createAdminSupabaseClient>;
  try {
    admin = createAdminSupabaseClient();
  } catch {
    return NextResponse.json({ error: "서버 설정을 확인해 주세요. 관리자 키가 누락되었습니다." }, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      email: data.user.email ?? null,
      nickname: data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "세모덕 유저",
      profile_image: data.user.user_metadata?.avatar_url ?? null
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (profileError) {
    return NextResponse.json({ error: "프로필 정보를 준비하지 못했습니다. 다시 로그인한 뒤 시도해 주세요." }, { status: 500 });
  }

  const { error } = await admin.from("admin_suggestions").insert({
    user_id: data.user.id,
    type: body.type,
    title: body.title,
    detail: body.detail,
    requested_gallery_name: body.galleryName || null,
    requested_gallery_slug: body.galleryName ? slugify(body.galleryName) : null,
    requested_gallery_category: body.galleryCategory || null
  });

  if (error) {
    const missingTable = error.message.includes("admin_suggestions") || error.message.includes("schema cache");
    return NextResponse.json(
      {
        error: missingTable ? "건의함 테이블이 아직 없습니다. Supabase SQL Editor에서 supabase/admin-suggestions.sql을 먼저 실행해주세요." : error.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
