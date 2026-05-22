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

const headers = {
  accept: "application/json",
  version: "1.0",
  clientid: "lq+utCM77nQkP611GTjHTw==",
  platform: "PC",
  accessToken: ""
};

function isPastSaleEnd(value) {
  if (!value) return false;
  const endTime = new Date(`${value.replace(" ", "T")}+09:00`).getTime();
  return Number.isFinite(endTime) && endTime < Date.now();
}

function imageOf(item) {
  const image = item.listImageUrls?.[0] || item.imageUrls?.[0] || item.listImageUrlInfo?.url || item.imageUrlInfo?.[0]?.url;
  if (!image) return null;
  return image.startsWith("//") ? `https:${image}` : image;
}

async function collectDotorisupProducts() {
  const items = [];
  for (let pageNumber = 1; pageNumber <= 200; pageNumber += 1) {
    const url = new URL("https://shop-api.e-ncp.com/products/search");
    url.searchParams.set("categoryNos", "435457");
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("pageNumber", String(pageNumber));
    url.searchParams.set("order.soldoutPlaceEnd", "true");
    url.searchParams.set("order.by", "RECENT_PRODUCT");
    url.searchParams.set("order.direction", "DESC");
    url.searchParams.set("filter.totalReviewCount", "true");
    url.searchParams.set("filter.soldout", "true");

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`dotorisup products ${response.status}`);

    const page = await response.json();
    items.push(...(page.items ?? []));
    const pageCount = Math.min(Number(page.pageCount || 1), 200);
    if (pageNumber >= pageCount) break;
  }

  return items
    .filter((item) => item.frontDisplayYn !== false)
    .filter((item) => !["STOP", "FINISHED", "ENDED"].includes(String(item.saleStatusType ?? "").toUpperCase()))
    .filter((item) => !isPastSaleEnd(item.saleEndYmdt))
    .map((item) => {
      const soldOut = Boolean(item.isSoldOut) || item.saleStatusType === "SOLDOUT" || item.stockCnt === 0 || item.mainStockCnt === 0;
      const comingSoon = item.saleStatusType === "READY" || (!soldOut && item.saleStartYmdt ? new Date(`${item.saleStartYmdt.replace(" ", "T")}+09:00`).getTime() > Date.now() : false);
      return {
        title: item.productName || `지브리 상품 ${item.productNo}`,
        normalizedTitle: (item.productName || `지브리 상품 ${item.productNo}`).toLowerCase(),
        brand: item.brandNameKo || item.brandName || "스튜디오 지브리",
        category: "애니굿즈",
        description: "도토리숲 공식샵에서 수집한 스튜디오 지브리 공식 상품입니다.",
        imageUrl: imageOf(item),
        mallName: "도토리숲",
        price: Number(item.salePrice || item.minSalePrice || 0),
        shippingFee: 2500,
        url: `https://www.dotorisup.com/product/detail/${item.productNo}`,
        availabilityLabel: soldOut ? "품절" : comingSoon ? "판매예정" : item.reservationData ? "예약판매" : "판매중"
      };
    });
}

async function ensureGhibliGallery() {
  const existing = await supabase.from("galleries").select("id").eq("slug", "ghibli").maybeSingle();
  if (existing.error) throw existing.error;

  let galleryId = existing.data?.id;
  if (!galleryId) {
    const inserted = await supabase
      .from("galleries")
      .insert({
        name: "지브리 갤러리",
        slug: "ghibli",
        description: "스튜디오 지브리와 도토리숲 굿즈, 팝업, 재입고 정보를 나누는 공간입니다.",
        category: "애니",
        thumbnail_url: "https://aniland1.cafe24.com/studio_ghibri/beneric/4992272703351_600.jpg",
        follower_count: 8420,
        post_count: 0
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    galleryId = inserted.data.id;
  }

  const deletedSource = await supabase.from("gallery_official_sources").delete().eq("gallery_id", galleryId);
  if (deletedSource.error?.code === "PGRST205") return galleryId;
  if (deletedSource.error) throw deletedSource.error;

  const source = await supabase.from("gallery_official_sources").insert({
    gallery_id: galleryId,
    official_site_url: "https://www.instagram.com/dotorisup/reels/",
    official_shop_url: "https://www.dotorisup.com/",
    shop_label: "도토리숲",
    notes: "도토리숲 공식 인스타그램과 공식샵 상품을 우선 확인합니다."
  });
  if (source.error?.code !== "PGRST205" && source.error) throw source.error;

  return galleryId;
}

async function importProduct(candidate) {
  const existing = await supabase.from("products").select("id,image_url").eq("normalized_title", candidate.normalizedTitle).maybeSingle();
  if (existing.error) throw existing.error;

  let productId = existing.data?.id;
  if (!productId) {
    const inserted = await supabase
      .from("products")
      .insert({
        title: candidate.title,
        normalized_title: candidate.normalizedTitle,
        brand: candidate.brand,
        category: candidate.category,
        description: candidate.description,
        image_url: candidate.imageUrl,
        is_official_product: true
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    productId = inserted.data.id;
  } else if (!existing.data.image_url && candidate.imageUrl) {
    const updated = await supabase.from("products").update({ image_url: candidate.imageUrl, is_official_product: true }).eq("id", productId);
    if (updated.error) throw updated.error;
  }

  const existingOffer = await supabase.from("product_offers").select("id").eq("product_id", productId).eq("url", candidate.url).maybeSingle();
  if (existingOffer.error) throw existingOffer.error;

  const payload = {
    source: "official_shop",
    mall_name: candidate.mallName,
    price: candidate.price,
    shipping_fee: candidate.shippingFee,
    condition: "new",
    is_official: true,
    is_used: false,
    special_benefit: candidate.availabilityLabel,
    url: candidate.url,
    last_checked_at: new Date().toISOString()
  };

  if (existingOffer.data?.id) {
    const updated = await supabase.from("product_offers").update(payload).eq("id", existingOffer.data.id);
    if (updated.error) throw updated.error;
    return "updated";
  }

  const insertedOffer = await supabase.from("product_offers").insert({ ...payload, product_id: productId });
  if (insertedOffer.error) throw insertedOffer.error;
  return "inserted";
}

await ensureGhibliGallery();
const candidates = await collectDotorisupProducts();
let inserted = 0;
let updated = 0;

for (const candidate of candidates) {
  const result = await importProduct(candidate);
  if (result === "inserted") inserted += 1;
  if (result === "updated") updated += 1;
}

console.log(JSON.stringify({ gallery: "ghibli", collected: candidates.length, inserted, updated }, null, 2));
