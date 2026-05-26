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

const apply = process.argv.includes("--apply");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const nonProductTitleNeedles = [
  "전체상품목록 바로가기",
  "본문 바로가기",
  "전체메뉴",
  "상품 Q&A",
  "상품 사용후기",
  "{{{productName}}}",
  "{{productName}}",
  "자세히보기 -->"
];

const nonProductUrlPatterns = [
  /\/board\//i,
  /\/cs\/event\//i,
  /#(category|contents|none)$/i,
  /\/category\/\d+$/i,
  /\/brand\/\d+$/i,
  /\{\{productNo\}\}/i
];

function isNonProduct(row) {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  const title = product?.title ?? "";
  const url = row.url ?? "";
  return nonProductTitleNeedles.some((needle) => title.includes(needle)) || nonProductUrlPatterns.some((pattern) => pattern.test(url));
}

const { data, error } = await supabase
  .from("product_offers")
  .select("id,url,price,products(id,title,brand,category)")
  .eq("is_official", true)
  .limit(1000);

if (error) throw error;

const candidates = (data ?? []).filter(isNonProduct).map((offer) => {
  const product = Array.isArray(offer.products) ? offer.products[0] : offer.products;
  return {
    offerId: offer.id,
    productId: product?.id,
    title: product?.title,
    brand: product?.brand,
    category: product?.category,
    price: offer.price,
    url: offer.url
  };
});

if (apply && candidates.length) {
  const offerIds = candidates.map((item) => item.offerId);
  const { error: deleteError } = await supabase.from("product_offers").delete().in("id", offerIds);
  if (deleteError) throw deleteError;
}

console.log(JSON.stringify({ apply, count: candidates.length, candidates }, null, 2));
