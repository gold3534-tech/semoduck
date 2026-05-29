import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  action: z.enum(["resolve", "reject"]),
  adminMessage: z.string().optional().default("")
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    if ("error" in session) {
      return session.error;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "건의 ID가 없습니다." },
        { status: 400 }
      );
    }

    const parsed = updateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { action, adminMessage } = parsed.data;
    const now = new Date().toISOString();
    const status = action === "resolve" ? "resolved" : "rejected";

    const { error } = await session.supabase
      .from("admin_suggestions")
      .update({
        status,
        admin_message: adminMessage,
        resolved_by: session.userId,
        resolved_at: now,
        updated_at: now
      })
      .eq("id", id)
      .eq("status", "pending");

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
            : "건의 처리에 실패했습니다."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    if ("error" in session) {
      return session.error;
    }

    const { id } = await params;

    const { error } = await session.supabase
      .from("admin_suggestions")
      .delete()
      .eq("id", id);

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
            : "건의 삭제에 실패했습니다."
      },
      { status: 500 }
    );
  }
}