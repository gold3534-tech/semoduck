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
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 300;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function parsePriceNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function extractPrice(html) {
  const patterns = [
    /"price"\s*:\s*"?([\d,]+)"?/i,
    /id=["']span_product_price_text["'][^>]*>\s*([\d,]+)/i,
    /class=["'][^"']*selling-price[^"']*["'][^>]*>\s*([\d,]+)/i,
    /class=["'][^"']*price[^"']*["'][^>]*>\s*([\d,]+)/i,
    /(?:판매가|salePrice|sellPrice|productPrice)[\s\S]{0,500}?([\d,]+)\s*(?:원|KRW)?/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const price = parsePriceNumber(match?.[1]);
    if (price > 0) return price;
  }
  return 0;
}

function isDetailUrl(url) {
  return /\/product\/detail|\/product-detail|product_no=|productNo=|\/product\/[^/?#]+\/\d+|\/shop\/\d+/i.test(url ?? "");
}

const { data, error } = await supabase
  .from("product_offers")
  .select("id,url,price,mall_name,products(id,title,brand)")
  .eq("is_official", true)
  .or("price.is.null,price.eq.0")
  .limit(limit);

if (error) throw error;

const updated = [];
const skipped = [];

for (const offer of data ?? []) {
  const product = Array.isArray(offer.products) ? offer.products[0] : offer.products;
  if (!isDetailUrl(offer.url)) {
    skipped.push({ offerId: offer.id, title: product?.title, url: offer.url, reason: "not-detail-url" });
    continue;
  }

  try {
    const response = await fetch(offer.url, {
      headers: {
        "user-agent": "Mozilla/5.0 SemoduckPriceFix/1.0",
        accept: "text/html,application/xhtml+xml"
      }
    });
    if (!response.ok) {
      skipped.push({ offerId: offer.id, title: product?.title, url: offer.url, reason: `http-${response.status}` });
      continue;
    }

    const html = await response.text();
    const price = extractPrice(html);
    if (price <= 0) {
      skipped.push({ offerId: offer.id, title: product?.title, url: offer.url, reason: "price-not-found" });
      continue;
    }

    if (apply) {
      const { error: updateError } = await supabase
        .from("product_offers")
        .update({ price, last_checked_at: new Date().toISOString() })
        .eq("id", offer.id);
      if (updateError) throw updateError;
    }

    updated.push({ offerId: offer.id, title: product?.title, url: offer.url, price });
  } catch (error) {
    skipped.push({
      offerId: offer.id,
      title: product?.title,
      url: offer.url,
      reason: error instanceof Error ? error.message : "unknown"
    });
  }
}

console.log(JSON.stringify({ apply, updatedCount: updated.length, skippedCount: skipped.length, updated, skipped }, null, 2));
