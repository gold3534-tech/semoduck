import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createPostSchema = z.object({
  gallerySlug: z.string().min(1),
  postType: z.enum(["general", "question", "review", "purchase_help", "info", "trade", "transfer", "giveaway", "notice"]),
  title: z.string().min(2),
  content: z.string().min(2),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional().default("")
});

export async function POST(request: Request) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
    const user = userData.user;

    if (!user || !authClient) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
    }

    const parsed = createPostSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
    }

    const body = parsed.data;
    let admin: ReturnType<typeof createAdminSupabaseClient> | null = null;
    try {
      admin = createAdminSupabaseClient();
    } catch {
      admin = null;
    }
    const db = admin ?? authClient;

    const { data: gallery, error: galleryError } = await db.from("galleries").select("id").eq("slug", body.gallerySlug).single();
    if (galleryError || !gallery) {
      return NextResponse.json({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: post, error } = await db
      .from("posts")
      .insert({
        gallery_id: gallery.id,
        user_id: user.id,
        title: body.title,
        content: body.content,
        post_type: body.postType,
        image_url: body.imageUrl || null,
        like_count: 0,
        comment_count: 0,
        bookmark_count: 0,
        is_deleted: false
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (admin) {
      for (const rawTag of body.tags) {
        const tag = rawTag.trim().replace(/^#/, "");
        if (!tag) continue;

        const { data: tagRow } = await admin.from("tags").upsert({ name: tag }, { onConflict: "name" }).select("id").single();
        if (tagRow) {
          await admin.from("post_tags").upsert({ post_id: post.id, tag_id: tagRow.id });
        }
      }
    }

    return NextResponse.json({ id: post.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "게시글 등록에 실패했습니다." }, { status: 500 });
  }
}
