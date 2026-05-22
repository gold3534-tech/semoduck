import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { officialProductCandidates, officialProductCandidatesForGallery } from "@/lib/official-product-imports";
import { collectOfficialShopCandidates } from "@/lib/official-shop-collector";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const importSchema = z.object({
  key: z.string().min(1).optional(),
  candidate: z
    .object({
      key: z.string().min(1),
      gallerySlug: z.string().min(1),
      title: z.string().min(2),
      brand: z.string().optional().default(""),
      category: z.string().min(1),
      description: z.string().optional().default(""),
      imageUrl: z.string().optional(),
      mallName: z.string().min(1),
      price: z.coerce.number().int().min(0).default(0),
      shippingFee: z.coerce.number().int().min(0).default(0),
      url: z.string().url(),
      source: z.enum(["official_shop", "naver_shopping"]),
      availabilityLabel: z.string().optional()
    })
    .optional()
});

async function requireAdmin() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email || !isAdminEmail(data.user.email)) {
    return { error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }
  return { admin: createAdminSupabaseClient() };
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const { searchParams } = new URL(request.url);
  const gallerySlug = searchParams.get("gallery");

  return NextResponse.json({
    items: officialProductCandidatesForGallery(gallerySlug)
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const body = importSchema.parse(await request.json());
  const candidate = body.candidate ?? officialProductCandidates.find((item) => item.key === body.key);
  if (!candidate) {
    return NextResponse.json({ error: "공식 상품 후보를 찾을 수 없습니다." }, { status: 404 });
  }

  const normalizedTitle = candidate.title.toLowerCase();
  const existing = await session.admin.from("products").select("id").eq("normalized_title", normalizedTitle).maybeSingle();
  const productId = existing.data?.id ?? null;

  const product = productId
    ? { id: productId }
    : (
        await session.admin
          .from("products")
          .insert({
            title: candidate.title,
            normalized_title: normalizedTitle,
            brand: candidate.brand,
            category: candidate.category,
            description: candidate.description,
            image_url: candidate.imageUrl ?? null,
            is_official_product: true
          })
          .select("id")
          .single()
      ).data;

  if (!product) {
    return NextResponse.json({ error: "공식 상품을 등록하지 못했습니다." }, { status: 500 });
  }

  const existingOffer = await session.admin.from("product_offers").select("id").eq("product_id", product.id).eq("url", candidate.url).maybeSingle();
  if (!existingOffer.data) {
    const offer = await session.admin.from("product_offers").insert({
      product_id: product.id,
      source: candidate.source,
      mall_name: candidate.mallName,
      price: candidate.price,
      shipping_fee: candidate.shippingFee,
      condition: "new",
      is_official: true,
      is_used: false,
      special_benefit: candidate.availabilityLabel ?? null,
      url: candidate.url,
      last_checked_at: new Date().toISOString()
    });

    if (offer.error) return NextResponse.json({ error: offer.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: product.id });
}

export async function PUT() {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const result = await collectOfficialShopCandidates();
  return NextResponse.json(result);
}
