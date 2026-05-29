import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().min(2).optional(),
});

function jsonError(error: unknown, fallback: string, status = 500) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase 클라이언트 생성 실패" },
        { status: 500 }
      );
    }

    const [postResult, commentsResult, tagsResult] = await Promise.all([
      supabase
        .from("posts")
        .select(
          "id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,image_url,profiles(nickname,email),galleries(name,slug)"
        )
        .eq("id", id)
        .eq("is_deleted", false)
        .single(),

      supabase
        .from("comments")
        .select("id,content,like_count,created_at,profiles(nickname,email)")
        .eq("post_id", id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true }),

      supabase.from("post_tags").select("tags(name)").eq("post_id", id),
    ]);

    if (postResult.error) {
      return NextResponse.json(
        { error: postResult.error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      post: postResult.data,
      comments: commentsResult.data ?? [],
      tags: (
        (tagsResult.data ?? []) as Array<{
          tags?: { name?: string } | Array<{ name?: string }> | null;
        }>
      )
        .map((row) =>
          Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name
        )
        .filter(Boolean),
    });
  } catch (error) {
    return jsonError(error, "게시글 정보를 불러오지 못했습니다.");
  }
}

async function requirePostAccess(id: string) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      error: NextResponse.json(
        { error: "Supabase 클라이언트 생성 실패" },
        { status: 500 }
      ),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (postError || !post) {
    return {
      error: NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      ),
    };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  return {
    db: supabase,
    user,
    isOwner: post.user_id === user.id,
    isAdmin: Boolean(isAdmin),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requirePostAccess(id);

    if ("error" in access) return access.error;

    if (!access.isOwner) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = updateSchema.parse(await request.json());

    const { error } = await access.db
      .from("posts")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "게시글을 수정하지 못했습니다.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requirePostAccess(id);

    if ("error" in access) return access.error;

    if (!access.isOwner && !access.isAdmin) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await access.db
      .from("posts")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "게시글을 삭제하지 못했습니다.");
  }
}