import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
        { error: "게시글 ID가 없습니다.", stage: "params" },
        { status: 400 }
      );
    }

    const authClient = await createServerSupabaseClient();

    if (!authClient) {
      return NextResponse.json(
        { error: "Supabase 인증 클라이언트를 생성하지 못했습니다.", stage: "auth-client" },
        { status: 500 }
      );
    }

    const { data: userData, error: userError } = await authClient.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { error: userError.message, stage: "auth" },
        { status: 401 }
      );
    }

    const user = userData.user;

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다.", stage: "auth" },
        { status: 401 }
      );
    }

    let json: unknown;

    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { error: "요청 본문을 읽지 못했습니다.", stage: "body" },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", stage: "validation" },
        { status: 400 }
      );
    }

    let admin: ReturnType<typeof createAdminSupabaseClient>;

    try {
      admin = createAdminSupabaseClient();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Supabase admin client 생성 실패",
          stage: "admin-client",
        },
        { status: 500 }
      );
    }

    const { type } = parsed.data;

    const { data: existing, error: existingError } = await admin
      .from("post_reactions")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .eq("type", type)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message, stage: "find-existing" },
        { status: 500 }
      );
    }

    let active = false;

    if (existing) {
      const { error: deleteError } = await admin
        .from("post_reactions")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message, stage: "delete-reaction" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await admin
        .from("post_reactions")
        .insert({
          post_id: id,
          user_id: user.id,
          type,
        });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message, stage: "insert-reaction" },
          { status: 500 }
        );
      }

      active = true;
    }

    const { count, error: countError } = await admin
      .from("post_reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id)
      .eq("type", type);

    if (countError) {
      return NextResponse.json(
        { error: countError.message, stage: "count-reactions" },
        { status: 500 }
      );
    }

    const column = type === "like" ? "like_count" : "bookmark_count";

    const { error: updateError } = await admin
      .from("posts")
      .update({ [column]: count ?? 0 })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message, stage: "update-post-count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      active,
      count: count ?? 0,
    });
  } catch (error) {
    console.error("reaction route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "처리하지 못했습니다.",
        stage: "catch",
      },
      { status: 500 }
    );
  }
}