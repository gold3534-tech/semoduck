import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  type: z.enum(["like", "bookmark"]),
});

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
      error: userError,
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
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { type } = parsed.data;

    const { data: existing, error: existingError } = await supabase
      .from("post_reactions")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .eq("type", type)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    let active = false;

    if (existing) {
      const { error: deleteError } = await supabase
        .from("post_reactions")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("post_reactions")
        .insert({
          post_id: id,
          user_id: user.id,
          type,
        });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      active = true;
    }

    const { count, error: countError } = await supabase
      .from("post_reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id)
      .eq("type", type);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      active,
      count: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "처리하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}