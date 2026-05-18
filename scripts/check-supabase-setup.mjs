import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const text = readFileSync(".env.local", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key.trim()] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing Supabase URL or service role key.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const checks = [];

const reportInsert = await supabase
  .from("reports")
  .select("id,category,detail,resolved_by,resolved_at")
  .limit(1);
checks.push(["reports extra columns", !reportInsert.error, reportInsert.error?.message]);

const postsSelect = await supabase.from("posts").select("id,report_count").limit(1);
checks.push(["posts.report_count", !postsSelect.error, postsSelect.error?.message]);

const postImagesSelect = await supabase.from("posts").select("id,image_url").limit(1);
checks.push(["posts.image_url", !postImagesSelect.error, postImagesSelect.error?.message]);

const inquiriesSelect = await supabase.from("market_inquiries").select("id,content").limit(1);
checks.push(["market_inquiries table", !inquiriesSelect.error, inquiriesSelect.error?.message]);

const rpcGallery = await supabase.rpc("recalculate_gallery_follower_count", { target_gallery_id: "00000000-0000-0000-0000-000000000000" });
checks.push(["recalculate_gallery_follower_count rpc", !rpcGallery.error, rpcGallery.error?.message]);

const rpcReport = await supabase.rpc("recalculate_post_report_count", { target_post_id: "00000000-0000-0000-0000-000000000000" });
checks.push(["recalculate_post_report_count rpc", !rpcReport.error, rpcReport.error?.message]);

const buckets = await supabase.storage.listBuckets();
const bucketNames = new Set((buckets.data ?? []).map((bucket) => bucket.name));
checks.push(["market-images bucket", bucketNames.has("market-images"), buckets.error?.message]);
checks.push(["gallery-images bucket", bucketNames.has("gallery-images"), buckets.error?.message]);
checks.push(["post-images bucket", bucketNames.has("post-images"), buckets.error?.message]);
checks.push(["product-images bucket", bucketNames.has("product-images"), buckets.error?.message]);

let failed = false;
for (const [name, ok, message] of checks) {
  const status = ok ? "OK" : "FAIL";
  console.log(`${status} ${name}${message ? ` - ${message}` : ""}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
