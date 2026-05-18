import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const authClient = await createServerSupabaseClient();
  const { data } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email || !isAdminEmail(data.user.email)) {
    return { error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }
  return { admin: createAdminSupabaseClient() };
}

export async function GET() {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const [reportsResult, linksResult, offersResult, galleriesResult] = await Promise.all([
    session.admin
      .from("reports")
      .select("id,reporter_id,category,detail,reason,status,created_at,target_id")
      .eq("target_type", "post")
      .order("created_at", { ascending: false }),
    session.admin.from("link_submissions").select("id,title,url,source,price,is_official,status,created_at").order("created_at", { ascending: false }),
    session.admin.from("product_offers").select("id,mall_name,url,price,source,is_official,products(title)").order("created_at", { ascending: false }).limit(30),
    session.admin.from("galleries").select("id,name,slug,thumbnail_url,follower_count,post_count").order("name")
  ]);

  const reports = reportsResult.data ?? [];
  const postIds = [...new Set(reports.map((report) => report.target_id).filter(Boolean))];
  const reporterIds = [...new Set(reports.map((report) => report.reporter_id).filter(Boolean))];
  const [postsResult, reportersResult] = await Promise.all([
    postIds.length
      ? session.admin.from("posts").select("id,title,content,report_count,is_deleted,galleries(name,slug)").in("id", postIds)
      : Promise.resolve({ data: [] }),
    reporterIds.length ? session.admin.from("profiles").select("id,email,nickname").in("id", reporterIds) : Promise.resolve({ data: [] })
  ]);

  const posts = new Map((postsResult.data ?? []).map((post) => [post.id, post]));
  const reporters = new Map((reportersResult.data ?? []).map((profile) => [profile.id, profile]));

  return NextResponse.json({
    reports: reports.map((report) => ({
      ...report,
      post: posts.get(report.target_id) ?? null,
      reporter: report.reporter_id ? reporters.get(report.reporter_id) ?? null : null
    })),
    linkSubmissions: linksResult.data ?? [],
    productOffers: offersResult.data ?? [],
    galleries: galleriesResult.data ?? []
  });
}
