import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["post", "market_item", "product"]),
  targetId: z.string().min(1),
  category: z.string().trim().min(1),
  detail: z.string().trim().min(1)
});

const targetTableMap = {
  post: "posts",
  market_item: "market_items",
  product: "products"
} as const;

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
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "신고 내용을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    const { targetType, targetId, category, detail } = parsed.data;

    const reason = `${category}: ${detail}`;

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        status: "pending"
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // 신고 수 증가는 실패해도 신고 접수 자체는 성공 처리
    const tableName = targetTableMap[targetType];

    try {
      const { data: target } = await supabase
        .from(tableName)
        .select("report_count")
        .eq("id", targetId)
        .single();

      await supabase
        .from(tableName)
        .update({
          report_count: Number(target?.report_count ?? 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", targetId);
    } catch {
      // report_count 컬럼이나 RLS 문제로 실패해도 무시
    }

    return NextResponse.json({
      ok: true,
      reportId: report.id
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "신고 접수에 실패했습니다."
      },
      { status: 500 }
    );
  }
}