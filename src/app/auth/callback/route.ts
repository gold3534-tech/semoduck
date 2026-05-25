import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next")?.startsWith("/") ? requestUrl.searchParams.get("next")! : "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? { error: new Error("Supabase 환경변수가 설정되지 않았습니다.") };
    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      const message = error.message.includes("code verifier") ? "로그인 정보가 만료되었습니다. 같은 브라우저에서 다시 로그인해 주세요." : error.message;
      loginUrl.searchParams.set("error", message);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
