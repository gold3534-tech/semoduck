import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["post", "market_item", "product"]),
  targetId: z.string().uuid(),
  category: z.string().min(1),
  detail: z.string().min(5),
});

export async function POST(request: Request) {
  try {
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
        { error: "요청 내용을 읽지 못했습니다." },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.errors[0]?.message ?? "입력값을 확인해 주세요.",
        },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const { data: existing, error: existingError } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("target_type", body.targetType)
      .eq("target_id", body.targetId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "이미 신고한 대상입니다." },
        { status: 409 }
      );
    }

    const reason = `${body.category}: ${body.detail}`;

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: body.targetType,
      target_id: body.targetId,
      category: body.category,
      detail: body.detail,
      reason,
      status: "pending",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "신고 처리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}