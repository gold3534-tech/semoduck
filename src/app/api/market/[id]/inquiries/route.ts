import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "문의 내용은 2자 이상 입력해 주세요.")
    .max(1000, "문의 내용은 1000자 이하로 입력해 주세요."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "거래글 ID가 없습니다." },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase 클라이언트를 생성하지 못했습니다." },
        { status: 500 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "문의 내용을 올바르게 입력해 주세요.",
        },
        { status: 400 },
      );
    }

    const { content } = parsed.data;

    const { data: marketItem, error: marketError } = await supabase
      .from("market_items")
      .select("id,seller_id,status,trade_type")
      .eq("id", id)
      .neq("trade_type", "transfer")
      .maybeSingle();

    if (marketError) {
      return NextResponse.json(
        { error: marketError.message },
        { status: 500 },
      );
    }

    if (!marketItem) {
      return NextResponse.json(
        { error: "거래글을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (marketItem.status === "hidden" || marketItem.status === "reported") {
      return NextResponse.json(
        { error: "문의할 수 없는 거래글입니다." },
        { status: 400 },
      );
    }

    if (marketItem.seller_id === user.id) {
      return NextResponse.json(
        { error: "본인 거래글에는 문의할 수 없습니다." },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabase
      .from("market_inquiries")
      .insert({
        market_item_id: id,
        user_id: user.id,
        content,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "문의를 등록하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}