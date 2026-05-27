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

const nonProductTitlePatterns = [
  /all products/i,
  /main content/i,
  /전체상품목록/,
  /본문 바로가기/,
  /전체메뉴/,
  /상품\s*(q&a|Q&A|문의|후기|사용후기)/i,
  /할인\s*및\s*사은품/,
  /첫\s*페이지|이전\s*페이지|다음\s*페이지|마지막\s*페이지/,
  /시즌\s*\d+\s*\(\d+\)/,
  /시즌별\s*상품/,
  /패키지\s*게임/,
  /피규어\s*\(\d+\)/,
  /스텔라이브\s*공식\s*굿즈/,
  /포켓몬스토어\s*코리아\s*공식\s*굿즈/,
  /리그\s*오브\s*레전드\s*공식\s*상점/,
  /웹툰프렌즈\s*공식\s*굿즈/,
  /BTS\s*공식\s*MD/i,
  /Riot Store\s*네이버\s*공식\s*브랜드스토어\s*상품/i,
  /공식\s*브랜드스토어\s*상품/,
  /\{\{\{?productName\}?\}\}/i
];

const nonProductUrlPatterns = [
  /\/board\//i,
  /\/cs\/event\//i,
  /#(category|contents|none)?$/i,
  /\/category\/\d+\/?$/i,
  /\/brand\/\d+\/?$/i,
  /\/brand\/[A-Za-z0-9_-]+\/?$/i,
  /\/product\/list\.html/i,
  /\/product\/detail\/%7B%7BproductNo%7D%7D/i,
  /\/category\//i,
  /\/collections?\/?$/i,
  /\/brand\.naver\.com\/[^/?#]+\/?$/i,
  /brand\.naver\.com\/[^/?#]+\/category\//i,
  /search\.shopping\.naver\.com/i,
  /weverseshop\.io\/?$/i,
  /store\.leagueoflegends\.co\.kr\/?$/i,
  /fanding\.kr\/@[^/]+\/shop\/?$/i,
  /\{\{productNo\}\}/i
];

function hasValidPrice(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function isDetailUrl(url) {
  return /\/product\/detail|\/product-detail|product_no=|productNo=|\/product\/[^/?#]+\/\d+|\/shop\/\d+/i.test(url ?? "");
}

function isNonProduct(row) {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  const title = product?.title ?? "";
  const url = row.url ?? "";

  if (nonProductTitlePatterns.some((pattern) => pattern.test(title))) return true;
  if (nonProductUrlPatterns.some((pattern) => pattern.test(url))) return true;

  // Zero-priced official rows that only point to a shop/listing page should not
  // appear as product cards. Keep real detail URLs so the UI can show
  // "price unavailable" instead of deleting a possibly valid product.
  if (!hasValidPrice(row.price) && !isDetailUrl(url)) return true;

  return false;
}

const { data, error } = await supabase
  .from("product_offers")
  .select("id,url,price,products(id,title,brand,category)")
  .eq("is_official", true)
  .or("price.is.null,price.eq.0")
  .limit(10000);

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
  const { error: deleteError } = await supabase
    .from("product_offers")
    .delete()
    .in("id", candidates.map((item) => item.offerId));
  if (deleteError) throw deleteError;
}

console.log(JSON.stringify({ apply, count: candidates.length, candidates }, null, 2));
