import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  tradeType: z.enum(["sell", "exchange", "giveaway"]).optional(),
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  price: z.coerce.number().int().min(0).optional(),
  region: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["active", "reserved", "completed", "hidden"]).optional()
});

async function requireOwner(id: string) {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;
  if (!user) return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };

  const admin = createAdminSupabaseClient();
  const { data: item } = await admin.from("market_items").select("seller_id").eq("id", id).single();
  if (item?.seller_id !== user.id) {
    return { error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };
  }

  return { admin };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await requireOwner(id);
  if (owner.error) return owner.error;

  const body = updateSchema.parse(await request.json());
  const payload = {
    ...(body.tradeType ? { trade_type: body.tradeType } : {}),
    ...(body.title ? { title: body.title } : {}),
    ...(body.description ? { description: body.description } : {}),
    ...(typeof body.price === "number" ? { price: body.price } : {}),
    ...(typeof body.region === "string" ? { region: body.region } : {}),
    ...(typeof body.imageUrl === "string" ? { image_url: body.imageUrl || null } : {}),
    ...(body.status ? { status: body.status } : {}),
    updated_at: new Date().toISOString()
  };

  const { error } = await owner.admin.from("market_items").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await requireOwner(id);
  if (owner.error) return owner.error;

  const { error } = await owner.admin.from("market_items").update({ status: "hidden", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
