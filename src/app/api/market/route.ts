import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createSchema = z.object({
  gallerySlug: z.string().min(1),
  tradeType: z.enum(["sell", "exchange", "giveaway"]),
  title: z.string().min(2),
  description: z.string().min(2),
  price: z.coerce.number().int().min(0).default(0),
  region: z.string().optional().default(""),
  imageUrl: z.string().optional().default("")
});

export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("market_items")
    .select("id,title,description,trade_type,status,price,region,image_url,created_at,profiles(nickname),galleries(name,slug)")
    .in("status", ["active", "reserved", "completed"])
    .neq("trade_type", "transfer")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((item) => ({
      ...item,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles,
      galleries: Array.isArray(item.galleries) ? item.galleries[0] ?? null : item.galleries
    }))
  });
}

export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = createSchema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { data: gallery } = await admin.from("galleries").select("id").eq("slug", body.gallerySlug).single();

  if (!gallery) {
    return NextResponse.json({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("market_items")
    .insert({
      seller_id: user.id,
      gallery_id: gallery.id,
      trade_type: body.tradeType,
      title: body.title,
      description: body.description,
      price: body.price,
      region: body.region,
      image_url: body.imageUrl || null,
      status: "active"
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
