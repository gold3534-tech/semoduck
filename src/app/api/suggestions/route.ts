import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const suggestionSchema = z.object({
  type: z.enum(["gallery_request", "feature_request", "bug_report", "other"]).default("gallery_request"),
  title: z.string().min(2),
  detail: z.string().min(5),
  galleryName: z.string().optional().default(""),
  gallerySlug: z.string().optional().default(""),
  galleryCategory: z.string().optional().default("")
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = suggestionSchema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("admin_suggestions").insert({
    user_id: data.user.id,
    type: body.type,
    title: body.title,
    detail: body.detail,
    requested_gallery_name: body.galleryName || null,
    requested_gallery_slug: body.gallerySlug || (body.galleryName ? slugify(body.galleryName) : null),
    requested_gallery_category: body.galleryCategory || null
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
