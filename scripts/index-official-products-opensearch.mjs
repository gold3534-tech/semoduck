import fs from "node:fs";
import { Client } from "@opensearch-project/opensearch";
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
const node = process.env.OPENSEARCH_NODE;
const index = process.env.OPENSEARCH_OFFICIAL_PRODUCTS_INDEX || "semoduck-official-products";

if (!node) {
  console.log(JSON.stringify({ skipped: true, reason: "OPENSEARCH_NODE is not configured" }, null, 2));
  process.exit(0);
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const client = new Client({
  node,
  auth:
    process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
      ? {
          username: process.env.OPENSEARCH_USERNAME,
          password: process.env.OPENSEARCH_PASSWORD
        }
      : undefined,
  ssl: {
    rejectUnauthorized: process.env.OPENSEARCH_REJECT_UNAUTHORIZED !== "false"
  }
});

function priceOrZero(value) {
  const price = Number(value || 0);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

const { data, error } = await supabase
  .from("products")
  .select("id,title,brand,category,description,image_url,is_official_product,product_offers(id,mall_name,price,shipping_fee,is_official,url,special_benefit)")
  .eq("is_deleted", false)
  .eq("is_official_product", true)
  .limit(5000);

if (error) throw error;

const exists = await client.indices.exists({ index });
if (!exists.body) {
  await client.indices.create({
    index,
    body: {
      settings: {
        analysis: {
          analyzer: {
            semoduck_ko: {
              tokenizer: "standard",
              filter: ["lowercase"]
            }
          }
        }
      },
      mappings: {
        properties: {
          title: { type: "text", analyzer: "semoduck_ko", fields: { keyword: { type: "keyword" } } },
          brand: { type: "text", analyzer: "semoduck_ko" },
          category: { type: "text", analyzer: "semoduck_ko" },
          description: { type: "text", analyzer: "semoduck_ko" },
          tags: { type: "text", analyzer: "semoduck_ko" },
          price: { type: "integer" },
          isOfficial: { type: "boolean" }
        }
      }
    }
  });
}

const body = [];
for (const product of data ?? []) {
  const offer = (product.product_offers ?? []).find((item) => item.is_official) ?? product.product_offers?.[0];
  if (!offer?.url) continue;
  body.push({ index: { _index: index, _id: product.id } });
  body.push({
    id: product.id,
    title: product.title,
    image: product.image_url,
    brand: product.brand,
    category: product.category,
    description: product.description,
    tags: [product.brand, product.category, offer.special_benefit].filter(Boolean),
    mallName: offer.mall_name,
    price: priceOrZero(offer.price),
    shippingFee: priceOrZero(offer.shipping_fee),
    url: offer.url,
    isOfficial: Boolean(product.is_official_product || offer.is_official)
  });
}

if (body.length) {
  const result = await client.bulk({ refresh: true, body });
  if (result.body.errors) {
    const failures = result.body.items.filter((item) => item.index?.error).slice(0, 10);
    throw new Error(`OpenSearch bulk indexing failed: ${JSON.stringify(failures, null, 2)}`);
  }
}

console.log(JSON.stringify({ indexed: body.length / 2, index }, null, 2));
