import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  content: z.string().trim().min(1, "댓글 내용을 입력해 주세요.")
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
        { error: "댓글 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        user_id: user.id,
        content,
        like_count: 0,
        is_deleted: false
      })
      .select("id, content, like_count, created_at, profiles(nickname, email)")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { error: rpcError } = await supabase.rpc(
      "increment_post_comment_count",
      {
        target_post_id: id
      }
    );

    if (rpcError) {
      const { data: currentPost, error: currentError } = await supabase
        .from("posts")
        .select("comment_count")
        .eq("id", id)
        .single();

      if (!currentError) {
        const { error: updateError } = await supabase
          .from("posts")
          .update({
            comment_count: Number(currentPost?.comment_count ?? 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "댓글 등록에 실패했습니다."
      },
      { status: 500 }
    );
  }
}