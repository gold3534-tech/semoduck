import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createGallerySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(1, "갤러리 주소를 입력해주세요."),
  description: z.string().optional().default(""),
  category: z.string().min(1),
  thumbnailUrl: z.string().optional().default(""),
  officialSiteUrl: z.string().url().optional().or(z.literal("")).default(""),
  officialShopUrl: z.string().url().optional().or(z.literal("")).default(""),
  officialShopLabel: z.string().optional().default("")
});

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
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
  const slug = slugify(body.slug);
  const existing = await session.admin.from("galleries").select("id,slug").eq("slug", slug).maybeSingle();

  if (existing.data) {
    return NextResponse.json({ error: `이미 존재하는 갤러리입니다. /galleries/${existing.data.slug}` }, { status: 409 });
  }

  const { data, error } = await session.admin
    .from("galleries")
    .insert({
      name: body.name,
      slug,
      description: body.description || "갤러리 설명은 준비 중입니다. 이후 로컬 LLM으로 자동 생성할 예정입니다.",
      category: body.category,
      thumbnail_url: body.thumbnailUrl || null,
      follower_count: 1200,
      post_count: 0
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.officialSiteUrl || body.officialShopUrl) {
    await session.admin.from("gallery_official_sources").insert({
      gallery_id: data.id,
      official_site_url: body.officialSiteUrl || body.officialShopUrl,
      official_shop_url: body.officialShopUrl || null,
      shop_label: body.officialShopLabel || null,
      notes: "관리자 갤러리 생성 시 입력"
    });
  }

  return NextResponse.json({ id: data.id, slug });
}
