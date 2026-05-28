import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const suggestionSchema = z.object({
  type: z
    .enum(["gallery_request", "feature_request", "bug_report", "other"])
    .default("gallery_request"),
  title: z.string().min(2, "제목을 2글자 이상 입력해주세요."),
  detail: z.string().min(5, "내용을 5글자 이상 입력해주세요."),
  galleryName: z.string().optional().default(""),
  galleryCategory: z.string().optional().default(""),
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
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase 클라이언트를 생성하지 못했습니다." },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 내용을 읽지 못했습니다. 다시 시도해 주세요." },
      { status: 400 }
    );
  }

  const parsed = suggestionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.errors[0]?.message ?? "입력값을 확인해주세요.",
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  /**
   * 프로필 upsert는 건의 등록 필수 로직이 아님.
   * profiles RLS가 애매하면 여기서 터질 수 있으니,
   * 일단 건의 등록과 분리하는 게 안전함.
   */
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      nickname:
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "세모덕 유저",
      profile_image: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { error } = await supabase.from("admin_suggestions").insert({
    user_id: user.id,
    type: body.type,
    title: body.title,
    detail: body.detail,
    requested_gallery_name: body.galleryName || null,
    requested_gallery_slug: body.galleryName
      ? slugify(body.galleryName)
      : null,
    requested_gallery_category: body.galleryCategory || null,
  });

  if (error) {
    console.error("suggestion insert error:", error);

    const missingTable =
      error.message.includes("admin_suggestions") ||
      error.message.includes("schema cache");

    return NextResponse.json(
      {
        error: missingTable
          ? "건의함 테이블이 아직 없습니다. Supabase SQL Editor에서 admin_suggestions 테이블을 먼저 확인해주세요."
          : error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}