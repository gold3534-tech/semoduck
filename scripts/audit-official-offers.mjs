import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data, error } = await supabase
  .from("product_offers")
  .select("id,product_id,url,is_official")
  .eq("is_official", true)
  .limit(10000);

if (error) throw error;

const groups = new Map();
for (const offer of data ?? []) {
  const key = `${offer.product_id}::${offer.url}`;
  groups.set(key, [...(groups.get(key) ?? []), offer.id]);
}

const duplicates = [...groups.entries()].filter(([, ids]) => ids.length > 1);

console.log(JSON.stringify({
  officialOffers: data?.length ?? 0,
  duplicateGroups: duplicates.length,
  duplicates: duplicates.slice(0, 20)
}, null, 2));
