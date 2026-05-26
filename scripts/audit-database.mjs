import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const tables = [
  "profiles",
  "galleries",
  "posts",
  "comments",
  "products",
  "product_offers",
  "market_items",
  "post_reactions",
  "reports",
  "admin_suggestions"
];

async function countTable(table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  return { table, count: error ? null : count, error: error?.message };
}

async function sample(table, queryBuilder, limit = 10) {
  const { data, error } = await queryBuilder.limit(limit);
  return { table, error: error?.message, rows: data ?? [] };
}

const counts = [];
for (const table of tables) {
  counts.push(await countTable(table));
}

const checks = {
  counts,
  officialZeroPrices: await sample(
    "product_offers",
    supabase
      .from("product_offers")
      .select("id,url,price,products(id,title,brand,category)")
      .eq("is_official", true)
      .or("price.is.null,price.eq.0")
      .order("created_at", { ascending: false }),
    20
  ),
  emptyProductImages: await sample(
    "products",
    supabase.from("products").select("id,title,brand,image_url").or("image_url.is.null,image_url.eq."),
    20
  ),
  emptyGalleryImages: await sample(
    "galleries",
    supabase.from("galleries").select("id,name,slug,thumbnail_url").or("thumbnail_url.is.null,thumbnail_url.eq."),
    20
  ),
  marketMissingImages: await sample(
    "market_items",
    supabase.from("market_items").select("id,title,trade_type,price,image_url").or("image_url.is.null,image_url.eq."),
    20
  ),
  postsMissingGallery: { rows: [] },
  marketMissingGallery: { rows: [] },
  duplicateGallerySlugs: [],
  duplicateProductTitles: []
};

const { data: galleries } = await supabase.from("galleries").select("slug,name");
const { data: galleryRows } = await supabase.from("galleries").select("id,slug,name");
const galleryIds = new Set((galleryRows ?? []).map((gallery) => gallery.id));
const gallerySlugCounts = new Map();
for (const gallery of galleries ?? []) gallerySlugCounts.set(gallery.slug, (gallerySlugCounts.get(gallery.slug) ?? 0) + 1);
checks.duplicateGallerySlugs = [...gallerySlugCounts.entries()].filter(([, count]) => count > 1);

const { data: postRows } = await supabase.from("posts").select("id,title,gallery_id").limit(5000);
checks.postsMissingGallery = {
  count: (postRows ?? []).filter((post) => post.gallery_id && !galleryIds.has(post.gallery_id)).length,
  rows: (postRows ?? []).filter((post) => post.gallery_id && !galleryIds.has(post.gallery_id)).slice(0, 20)
};

const { data: marketRows } = await supabase.from("market_items").select("id,title,gallery_id").limit(5000);
checks.marketMissingGallery = {
  count: (marketRows ?? []).filter((item) => item.gallery_id && !galleryIds.has(item.gallery_id)).length,
  rows: (marketRows ?? []).filter((item) => item.gallery_id && !galleryIds.has(item.gallery_id)).slice(0, 20)
};

const { data: products } = await supabase.from("products").select("title,brand").limit(5000);
const productTitleCounts = new Map();
for (const product of products ?? []) {
  const key = `${product.brand ?? ""}::${product.title ?? ""}`;
  productTitleCounts.set(key, (productTitleCounts.get(key) ?? 0) + 1);
}
checks.duplicateProductTitles = [...productTitleCounts.entries()]
  .filter(([, count]) => count > 1)
  .slice(0, 30)
  .map(([key, count]) => ({ key, count }));

console.log(JSON.stringify(checks, null, 2));
