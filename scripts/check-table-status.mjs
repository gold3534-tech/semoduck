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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const tables = process.argv.slice(2);
const checks = [];

for (const table of tables) {
  const result = await supabase.from(table).select("id", { count: "exact" }).limit(1);
  checks.push({
    table,
    count: result.count,
    sampleRows: result.data?.length ?? 0,
    error: result.error ? { code: result.error.code, message: result.error.message } : null
  });
}

console.log(JSON.stringify(checks, null, 2));
