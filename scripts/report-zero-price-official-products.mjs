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

const { data, error } = await supabase
  .from("product_offers")
  .select("id,mall_name,url,price,products(id,title,brand,category,is_official_product)")
  .eq("is_official", true)
  .or("price.is.null,price.eq.0")
  .limit(200);

if (error) throw error;

const items = (data ?? []).map((offer) => {
  const product = Array.isArray(offer.products) ? offer.products[0] : offer.products;
  return {
    offerId: offer.id,
    productId: product?.id,
    title: product?.title,
    brand: product?.brand,
    category: product?.category,
    mallName: offer.mall_name,
    price: offer.price,
    url: offer.url
  };
});

console.log(JSON.stringify({ count: items.length, items }, null, 2));
