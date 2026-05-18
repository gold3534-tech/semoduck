import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().min(2),
  brand: z.string().optional().default(""),
  category: z.string().min(1),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  isOfficialProduct: z.boolean().default(false),
  offer: z.object({
    source: z.enum(["official_shop", "naver_shopping", "coupang", "user_submission", "internal_market", "external_search"]),
    mallName: z.string().min(1),
    price: z.coerce.number().int().min(0),
    shippingFee: z.coerce.number().int().min(0).default(0),
    url: z.string().url(),
    isOfficial: z.boolean().default(false),
    specialBenefit: z.string().optional().default("")
  })
});

export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email || !isAdminEmail(data.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = schema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { data: product, error } = await admin
    .from("products")
    .insert({
      title: body.title,
      normalized_title: body.title.toLowerCase(),
      brand: body.brand || null,
      category: body.category,
      description: body.description || null,
      image_url: body.imageUrl || null,
      is_official_product: body.isOfficialProduct
    })
    .select("id")
    .single();

  if (error || !product) {
    return NextResponse.json({ error: error?.message ?? "상품을 등록하지 못했습니다." }, { status: 500 });
  }

  const offer = await admin.from("product_offers").insert({
    product_id: product.id,
    source: body.offer.source,
    mall_name: body.offer.mallName,
    price: body.offer.price,
    shipping_fee: body.offer.shippingFee,
    condition: "new",
    is_official: body.offer.isOfficial,
    is_used: false,
    special_benefit: body.offer.specialBenefit || null,
    url: body.offer.url,
    last_checked_at: new Date().toISOString()
  });

  if (offer.error) {
    return NextResponse.json({ error: offer.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: product.id });
}
