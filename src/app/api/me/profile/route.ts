import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  interests: z.array(z.string()).default([])
});

export async function PATCH(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = schema.parse(await request.json());
  const admin = createAdminSupabaseClient();
  const { data: interestRows, error } = await admin.from("interests").select("id,name").in("name", body.interests);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("user_interests").delete().eq("user_id", user.id);
  if (interestRows?.length) {
    const { error: insertError } = await admin.from("user_interests").insert(interestRows.map((interest) => ({ user_id: user.id, interest_id: interest.id })));
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ interests: interestRows?.map((interest) => interest.name) ?? [] });
}
