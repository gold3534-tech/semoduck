import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  nickname: z.string().trim().min(1).max(24).optional(),
  interests: z.array(z.string()).default([])
});

export async function PATCH(request: Request) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
    const user = userData.user;
    if (!user || !authClient) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = schema.parse(await request.json());
    let admin: ReturnType<typeof createAdminSupabaseClient> | null = null;
    try {
      admin = createAdminSupabaseClient();
    } catch {
      admin = null;
    }
    const db = admin ?? authClient;

    if (body.nickname) {
      const { error: profileError } = await db.from("profiles").update({ nickname: body.nickname }).eq("id", user.id);
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { data: interestRows, error } = await db.from("interests").select("id,name").in("name", body.interests);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await db.from("user_interests").delete().eq("user_id", user.id);
    if (interestRows?.length) {
      const { error: insertError } = await db.from("user_interests").insert(interestRows.map((interest) => ({ user_id: user.id, interest_id: interest.id })));
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ nickname: body.nickname, interests: interestRows?.map((interest) => interest.name) ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "프로필을 저장하지 못했습니다." }, { status: 500 });
  }
}
