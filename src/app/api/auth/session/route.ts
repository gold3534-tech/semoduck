import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = data.user;

  if (!supabase || !user) {
    return NextResponse.json({ user: null });
  }

  const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      nickname: profile?.nickname ?? user.user_metadata?.name ?? null
    }
  });
}
