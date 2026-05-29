import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["post", "market_item", "product"]),
  targetId: z.string().min(1),
  action: z.enum(["dismiss", "delete"])
});

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      error: NextResponse.json(
        { error: "Supabase 클라이언트를 생성하지 못했습니다." },
        { status: 500 }
      )
    };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      )
    };
  }

  if (!isAdminEmail(user.email)) {
    return {
      error: NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      )
    };
  }

  return {
    supabase,
    userId: user.id
  };
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();

    if ("error" in session) {
      return session.error;
    }

    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { targetType, targetId, action } = parsed.data;
    const now = new Date().toISOString();
    const reportStatus = action === "dismiss" ? "dismissed" : "accepted";

    const { error: reportError } = await session.supabase
      .from("reports")
      .update({
        status: reportStatus,
        resolved_by: session.userId,
        resolved_at: now
      })
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("status", "pending");

    if (reportError) {
      return NextResponse.json(
        { error: reportError.message },
        { status: 500 }
      );
    }

    if (targetType === "post") {
      const { error: postError } = await session.supabase
        .from("posts")
        .update({
          is_deleted: action === "delete",
          report_count: 0,
          updated_at: now
        })
        .eq("id", targetId);

      if (postError) {
        return NextResponse.json(
          { error: postError.message },
          { status: 500 }
        );
      }
    }

    if (targetType === "market_item") {
      const { error: marketError } = await session.supabase
        .from("market_items")
        .update({
          is_deleted: action === "delete",
          report_count: 0,
          updated_at: now
        })
        .eq("id", targetId);

      if (marketError) {
        return NextResponse.json(
          { error: marketError.message },
          { status: 500 }
        );
      }
    }

    if (targetType === "product") {
      const { error: productError } = await session.supabase
        .from("products")
        .update({
          is_deleted: action === "delete",
          report_count: 0,
          updated_at: now
        })
        .eq("id", targetId);

      if (productError) {
        return NextResponse.json(
          { error: productError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "신고 처리에 실패했습니다."
      },
      { status: 500 }
    );
  }
}