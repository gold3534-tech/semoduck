import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createGallerySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional().default(""),
  description: z.string().min(5),
  category: z.string().min(1),
  thumbnailUrl: z.string().optional().default("")
});

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `gallery-${Date.now()}`;
}

async function requireAdmin() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email || !isAdminEmail(data.user.email)) {
    return { error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }
  return { admin: createAdminSupabaseClient() };
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const body = createGallerySchema.parse(await request.json());
  const { data, error } = await session.admin
    .from("galleries")
    .insert({
      name: body.name,
      slug: body.slug || slugify(body.name),
      description: body.description,
      category: body.category,
      thumbnail_url: body.thumbnailUrl || null,
      follower_count: 1200,
      post_count: 0
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
