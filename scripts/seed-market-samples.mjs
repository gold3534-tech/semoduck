import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const samples = [
  {
    seller: "gold3534+market@gmail.com",
    gallery: "eternal-return",
    product: "이터널 리턴",
    trade_type: "sell",
    status: "active",
    price: 18000,
    region: "서울 신촌",
    title: "이터널리턴 시즌05 장패드 판매",
    description: "책상 사이즈랑 안 맞아서 정리합니다. 개봉만 해보고 사용은 거의 안 했고, 말림 없이 보관했습니다.",
    image_url: "https://estar-egg.com/web/product/medium/202502/9986a1a0d412ddcea4c4ec714ea044b5.png"
  },
  {
    seller: "gold3534+lol@gmail.com",
    gallery: "eternal-return",
    product: "시즌10 (15)",
    trade_type: "exchange",
    status: "active",
    price: 0,
    region: "경기 수원",
    title: "다르코 온더락잔 다른 시즌 굿즈로 교환",
    description: "컵류를 잘 안 써서 장패드나 카드지갑 쪽으로 교환 원합니다. 박스 상태까지 같이 확인해드릴게요.",
    image_url: "https://estar-egg.com/web/product/medium/202502/a28d9c68cc0bc41d7b0e0ac8abd025b1.png"
  },
  {
    seller: "gold3534+stellive@gmail.com",
    gallery: "eternal-return",
    product: "시즌9 (10)",
    trade_type: "giveaway",
    status: "reserved",
    price: 0,
    region: "서울 건대입구",
    title: "셀린 후드티 포토카드만 나눔",
    description: "후드티 구매하면서 받은 포토카드 여분입니다. 접힘 없고 슬리브에 넣어뒀어요. 예약중입니다.",
    image_url: "https://estar-egg.com/web/product/medium/202502/21c884d4ede55a02919000a488e95b81.png"
  },
  {
    seller: "gold3534+pokemon@gmail.com",
    gallery: "eternal-return",
    product: "시즌8 (5)",
    trade_type: "sell",
    status: "active",
    price: 9000,
    region: "부산 서면",
    title: "시즌7 ACADEMY 카드지갑 판매",
    description: "새 상품으로 보관하다가 다른 지갑을 쓰게 돼서 판매합니다. 택배 가능하고 완충해서 보내드립니다.",
    image_url: "https://estar-egg.com/web/product/medium/202507/4b31d9c2c7f46b86fc376e6bda5e60c3.png"
  },
  {
    seller: "gold3534+lol@gmail.com",
    gallery: "lol",
    product: "리그 오브 레전드 공식 상점",
    trade_type: "sell",
    status: "active",
    price: 29000,
    region: "대전 둔산",
    title: "LoL 아케인 아트북 스탠다드 에디션 판매",
    description: "한 번 훑어본 뒤 책장 보관했습니다. 모서리 눌림 거의 없고, 직거래면 현장에서 상태 확인 가능합니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8869409/88694098748.jpg"
  },
  {
    seller: "gold3534+sanrio@gmail.com",
    gallery: "sanrio",
    product: "산리오 쿠로미 얼굴 인형 키링",
    trade_type: "exchange",
    status: "active",
    price: 0,
    region: "서울 홍대",
    title: "쿠로미 키링 마이멜로디로 교환 원해요",
    description: "쿠로미 얼굴 키링 미개봉입니다. 마이멜로디나 시나모롤 키링과 교환 희망합니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg"
  },
  {
    seller: "gold3534+pokemon@gmail.com",
    gallery: "pokemon",
    product: "포켓몬 카드 9포켓 바인더",
    trade_type: "sell",
    status: "active",
    price: 6000,
    region: "인천 부평",
    title: "포켓몬 9포켓 바인더 상태 좋은 것 판매",
    description: "카드 정리하다가 남은 바인더 판매합니다. 사용감 거의 없고 속지는 일부 포함입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg"
  },
  {
    seller: "gold3534+onepiece@gmail.com",
    gallery: "onepiece",
    product: "원피스 루피 기어5 피규어",
    trade_type: "giveaway",
    status: "active",
    price: 0,
    region: "대구 동성로",
    title: "원피스 피규어 박스 보호케이스 나눔",
    description: "루피 피규어 박스에 맞춰 쓰던 보호케이스입니다. 박스 보관하시는 분 가져가세요.",
    image_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg"
  },
  {
    seller: "gold3534+stellive@gmail.com",
    gallery: "stellive",
    product: "스텔라이브 STAR TRAIL 앨범 굿즈",
    trade_type: "exchange",
    status: "active",
    price: 0,
    region: "광주 충장로",
    title: "스텔라이브 앨범 특전 포카 교환",
    description: "중복 특전 포카가 나와서 다른 멤버 특전과 교환하고 싶습니다. 하자 없는 것만 교환해요.",
    image_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg"
  },
  {
    seller: "gold3534+webtoon@gmail.com",
    gallery: "webtoon-goods",
    product: "네이버 웹툰 아크릴 스탠드 랜덤 챰",
    trade_type: "sell",
    status: "reserved",
    price: 3500,
    region: "서울 합정",
    title: "웹툰 랜덤 아크릴 챰 중복 판매",
    description: "팝업에서 뽑은 랜덤 챰 중복분입니다. 예약중이고 불발되면 다시 열어둘게요.",
    image_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg"
  },
  {
    seller: "gold3534+bts@gmail.com",
    gallery: "bts",
    product: "BTS 포토카드 바인더",
    trade_type: "giveaway",
    status: "active",
    price: 0,
    region: "서울 잠실",
    title: "BTS 바인더 속지 여분 나눔",
    description: "바인더 속지 여분이 조금 남아서 나눔합니다. 포토카드 정리 시작하는 분께 드리고 싶어요.",
    image_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg"
  }
];

const legacySampleTitles = [
  "이터널리턴 아크릴 스탠드 일괄 판매",
  "이터널리턴 시즌 굿즈 교환 구해요",
  "이터널리턴 특전 엽서 나눔",
  "이리 미니 캔뱃지 세트 판매",
  "라이엇스토어 티모 모자 판매"
];

async function fetchLookup(table, select, key) {
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  return new Map(data.map((item) => [item[key], item]));
}

async function main() {
  const [profiles, galleries, products] = await Promise.all([
    fetchLookup("profiles", "id,email", "email"),
    fetchLookup("galleries", "id,slug", "slug"),
    fetchLookup("products", "id,title", "title")
  ]);

  const titles = [...samples.map((sample) => sample.title), ...legacySampleTitles];
  const { error: cleanupExactError } = await supabase.from("market_items").delete().in("title", titles);
  if (cleanupExactError) throw cleanupExactError;

  const { error: cleanupBrokenError } = await supabase.from("market_items").delete().like("title", "%?%");
  if (cleanupBrokenError) throw cleanupBrokenError;

  const now = Date.now();
  const rows = samples.map((sample, index) => ({
    seller_id: profiles.get(sample.seller)?.id ?? profiles.get("gold3534+market@gmail.com")?.id,
    gallery_id: galleries.get(sample.gallery)?.id,
    product_id: products.get(sample.product)?.id ?? null,
    trade_type: sample.trade_type,
    status: sample.status,
    title: sample.title,
    description: sample.description,
    price: sample.price,
    region: sample.region,
    image_url: sample.image_url ?? null,
    created_at: new Date(now - index * 1000 * 60 * 17).toISOString(),
    updated_at: new Date(now - index * 1000 * 60 * 17).toISOString()
  }));

  const missing = rows.filter((row) => !row.gallery_id || !row.seller_id);
  if (missing.length) throw new Error(`Missing relation for ${missing.map((row) => row.title).join(", ")}`);

  const { data, error } = await supabase.from("market_items").insert(rows).select("title,trade_type,status");
  if (error) throw error;

  console.log(`Inserted ${data.length} market samples`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
