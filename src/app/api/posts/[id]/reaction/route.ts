import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  type: z.enum(["like", "bookmark"])
});

type TogglePostReactionResult = {
  is_active: boolean;
  new_count: number;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "게시글 ID가 없습니다." },
        { status: 400 }
      );
    }

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

    let json: unknown;

    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { error: "요청 본문을 읽지 못했습니다." },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { type } = parsed.data;

    const { data, error } = await supabase
      .rpc("toggle_post_reaction", {
        target_post_id: id,
        reaction_type: type
      })
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = data as TogglePostReactionResult | null;

    return NextResponse.json({
      active: Boolean(result?.is_active),
      count: Number(result?.new_count ?? 0)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "처리하지 못했습니다."
      },
      { status: 500 }
    );
  }
}