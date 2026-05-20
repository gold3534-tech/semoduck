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

  const [reportsResult, linksResult, offersResult, galleriesResult, productsResult, suggestionsResult] = await Promise.all([
    session.admin.from("reports").select("id,reporter_id,target_type,target_id,category,detail,reason,status,created_at").order("created_at", { ascending: false }),
    session.admin.from("link_submissions").select("id,title,url,source,price,is_official,status,created_at").order("created_at", { ascending: false }),
    session.admin.from("product_offers").select("id,mall_name,url,price,source,is_official,products(title)").order("created_at", { ascending: false }).limit(30),
    session.admin.from("galleries").select("id,name,slug,thumbnail_url,follower_count,post_count").order("name"),
    session.admin.from("products").select("id,title,category,brand,image_url,report_count,is_deleted").eq("is_deleted", false).order("created_at", { ascending: false }).limit(50),
    session.admin.from("admin_suggestions").select("id,user_id,type,title,detail,requested_gallery_name,requested_gallery_slug,requested_gallery_category,status,admin_note,created_at,reviewed_at").order("created_at", { ascending: false })
  ]);

  const reports = reportsResult.data ?? [];
  const suggestions = suggestionsResult.data ?? [];
  const reporterIds = [...new Set([...reports.map((report) => report.reporter_id), ...suggestions.map((suggestion) => suggestion.user_id)].filter(Boolean))];
  const postIds = reports.filter((report) => report.target_type === "post").map((report) => report.target_id);
  const marketIds = reports.filter((report) => report.target_type === "market_item").map((report) => report.target_id);
  const productIds = reports.filter((report) => report.target_type === "product").map((report) => report.target_id);

  const [reportersResult, postsResult, marketsResult, reportProductsResult] = await Promise.all([
    reporterIds.length ? session.admin.from("profiles").select("id,email,nickname").in("id", reporterIds) : Promise.resolve({ data: [] }),
    postIds.length ? session.admin.from("posts").select("id,title,content,is_deleted").in("id", postIds) : Promise.resolve({ data: [] }),
    marketIds.length ? session.admin.from("market_items").select("id,title,description,status").in("id", marketIds) : Promise.resolve({ data: [] }),
    productIds.length ? session.admin.from("products").select("id,title,description,is_deleted").in("id", productIds) : Promise.resolve({ data: [] })
  ]);

  const reporters = new Map((reportersResult.data ?? []).map((profile) => [profile.id, profile]));
  const posts = new Map((postsResult.data ?? []).map((item) => [item.id, item]));
  const markets = new Map((marketsResult.data ?? []).map((item) => [item.id, item]));
  const products = new Map((reportProductsResult.data ?? []).map((item) => [item.id, item]));

  return NextResponse.json({
    reports: reports.map((report) => ({
      ...report,
      reporter: report.reporter_id ? reporters.get(report.reporter_id) ?? null : null,
      target:
        report.target_type === "post"
          ? posts.get(report.target_id) ?? null
          : report.target_type === "market_item"
            ? markets.get(report.target_id) ?? null
            : products.get(report.target_id) ?? null
    })),
    linkSubmissions: linksResult.data ?? [],
    productOffers: offersResult.data ?? [],
    galleries: galleriesResult.data ?? [],
    products: productsResult.data ?? [],
    suggestions: suggestions.map((suggestion) => ({
      ...suggestion,
      user: suggestion.user_id ? reporters.get(suggestion.user_id) ?? null : null
    }))
  });
}
