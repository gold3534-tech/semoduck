import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.resolve(".env.local");
  const env = {};
  if (!fs.existsSync(envPath)) return env;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function must(value, name) {
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

const env = loadEnv();
const supabaseUrl = must(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = must(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const seedUsers = [
  { key: "admin", email: "gold3534@gmail.com", password: "admin1234", nickname: "세모덕관리자", role: "admin" },
  { key: "sanrio", email: "gold3534+sanrio@gmail.com", password: "semo1234", nickname: "쿠로미수집가", role: "user" },
  { key: "pokemon", email: "gold3534+pokemon@gmail.com", password: "semo1234", nickname: "카드정리요정", role: "user" },
  { key: "onepiece", email: "gold3534+onepiece@gmail.com", password: "semo1234", nickname: "루피기어5", role: "user" },
  { key: "webtoon", email: "gold3534+webtoon@gmail.com", password: "semo1234", nickname: "팝업줄서는중", role: "user" },
  { key: "bts", email: "gold3534+bts@gmail.com", password: "semo1234", nickname: "보라MD", role: "user" },
  { key: "stellive", email: "gold3534+stellive@gmail.com", password: "semo1234", nickname: "별빛굿즈러", role: "user" },
  { key: "lol", email: "gold3534+lol@gmail.com", password: "semo1234", nickname: "미드차이", role: "user" },
  { key: "market", email: "gold3534+market@gmail.com", password: "semo1234", nickname: "교환요정", role: "user" }
];

const galleries = [
  { name: "산리오 갤러리", slug: "sanrio", description: "쿠로미, 마이멜로디, 시나모롤 굿즈와 재입고 정보를 나누는 공간", category: "캐릭터", thumbnail_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg", follower_count: 12430, post_count: 842 },
  { name: "포켓몬 갤러리", slug: "pokemon", description: "포켓몬 카드, 키링, 인형, 팝업스토어 소식을 모아요", category: "게임", thumbnail_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg", follower_count: 9870, post_count: 620 },
  { name: "원피스 갤러리", slug: "onepiece", description: "피규어, 점프샵, 한정판 예약 정보를 공유합니다", category: "애니", thumbnail_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg", follower_count: 7460, post_count: 411 },
  { name: "웹툰 굿즈 갤러리", slug: "webtoon-goods", description: "웹툰 단행본 특전, 아크릴 스탠드, 팝업 굿즈 후기", category: "웹툰", thumbnail_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg", follower_count: 5320, post_count: 359 },
  { name: "BTS 갤러리", slug: "bts", description: "포토카드, 앨범 특전, 공식 MD 구매 정보를 정리해요", category: "아이돌", thumbnail_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg", follower_count: 15110, post_count: 1203 },
  { name: "스텔라이브 갤러리", slug: "stellive", description: "버튜버 굿즈, 방송 특전, 콜라보 카페 이야기를 모으는 갤러리", category: "버튜버", thumbnail_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg", follower_count: 4310, post_count: 288 },
  { name: "롤 갤러리", slug: "lol", description: "롤드컵 굿즈, 팀 유니폼, 피규어와 교환 정보를 공유합니다", category: "게임", thumbnail_url: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg", follower_count: 6920, post_count: 503 }
];

const productSeeds = [
  {
    key: "kuromi-keyring",
    title: "산리오 쿠로미 얼굴 인형 키링",
    normalized_title: "산리오 쿠로미 키링",
    brand: "산리오",
    category: "캐릭터굿즈",
    description: "네이버 쇼핑 결과 기반의 쿠로미 인형 키링입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "21세기 문방구", price: 4900, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/11346986476" },
      { source: "naver_shopping", mall_name: "The 하니샵", price: 11700, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/13249263774" }
    ]
  },
  {
    key: "pokemon-binder",
    title: "포켓몬 카드 9포켓 바인더",
    normalized_title: "포켓몬 카드 바인더",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "카드 수집용 9포켓 바인더입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "Basilisk", price: 8000, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/11080719169" },
      { source: "naver_shopping", mall_name: "잇템잡화점", price: 6700, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/6507549767" }
    ]
  },
  {
    key: "onepiece-figure",
    title: "원피스 루피 기어5 피규어",
    normalized_title: "원피스 루피 기어5 피규어",
    brand: "원피스",
    category: "애니굿즈",
    description: "루피 기어5 디자인 피규어입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    is_official_product: true,
    offers: [
      { source: "naver_shopping", mall_name: "페간샵", price: 23000, shipping_fee: 3000, condition: "new", is_official: true, is_used: false, url: "https://smartstore.naver.com/main/products/11717586939" },
      { source: "naver_shopping", mall_name: "큰부자", price: 19800, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/10333111816" }
    ]
  },
  {
    key: "webtoon-acrylic",
    title: "네이버 웹툰 아크릴 스탠드 랜덤 챰",
    normalized_title: "웹툰 아크릴 스탠드 챰",
    brand: "웹툰샵",
    category: "웹툰굿즈",
    description: "웹툰샵에서 판매되는 랜덤 아크릴 스탠드/챰 굿즈입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg",
    is_official_product: true,
    offers: [
      { source: "naver_shopping", mall_name: "웹툰샵", price: 3000, shipping_fee: 3000, condition: "new", is_official: true, is_used: false, url: "https://smartstore.naver.com/main/products/392160127" },
      { source: "naver_shopping", mall_name: "웹툰샵", price: 3500, shipping_fee: 3000, condition: "new", is_official: true, is_used: false, url: "https://smartstore.naver.com/main/products/4679439558" }
    ]
  },
  {
    key: "bts-binder",
    title: "BTS 포토카드 바인더",
    normalized_title: "BTS 포토카드 바인더",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "포토카드 보관용 바인더입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "GouShop", price: 17500, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/12142610372" },
      { source: "naver_shopping", mall_name: "KIWICK", price: 55000, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, special_benefit: "달마중 굿즈", url: "https://smartstore.naver.com/main/products/8015303214" }
    ]
  },
  {
    key: "stellive-album",
    title: "스텔라이브 STAR TRAIL 앨범 굿즈",
    normalized_title: "스텔라이브 STAR TRAIL 앨범",
    brand: "스텔라이브",
    category: "버튜버굿즈",
    description: "스텔라이브 앨범과 관련 굿즈입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "스컬데이 일렉트릭", price: 19800, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/13384931910" },
      { source: "naver_shopping", mall_name: "귀호강 주파수", price: 19800, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/13384947686" }
    ]
  },
  {
    key: "lol-uniform",
    title: "롤드컵 T1 스타일 유니폼 자켓",
    normalized_title: "롤드컵 유니폼 자켓",
    brand: "T1",
    category: "게임굿즈",
    description: "롤드컵 분위기의 팀 유니폼/자켓 상품입니다.",
    image_url: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "11번가", price: 45500, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://www.11st.co.kr/connect/Gateway.tmall?method=Xsite&prdNo=9345655507&tid=1000000061" },
      { source: "naver_shopping", mall_name: "감마즈무역상사", price: 67790, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/11118978827" }
    ]
  }
];

const posts = [
  { gallery: "sanrio", user: "sanrio", title: "[구매고민] 쿠로미 키링 정품 어디서 사?", content: "네이버에 가격 차이가 꽤 나서 공식몰이랑 비교 중이에요. 예약 특전 있는 판매처도 있나요?", post_type: "purchase_help", like_count: 128, comment_count: 2, bookmark_count: 56 },
  { gallery: "sanrio", user: "market", title: "산리오 얼굴 인형 키링 실물 후기", content: "가방에 달면 생각보다 큼직해요. 실버비즈가 사진보다 반짝이고 쿠로미 색감도 괜찮습니다.", post_type: "review", like_count: 67, comment_count: 1, bookmark_count: 21 },
  { gallery: "pokemon", user: "pokemon", title: "포켓몬 카드 바인더 360장짜리 써본 사람?", content: "바실리스크 바인더가 가격은 괜찮은데 카드가 휘는지 궁금해요. 슬리브 끼운 상태로 들어가나요?", post_type: "question", like_count: 89, comment_count: 1, bookmark_count: 22 },
  { gallery: "pokemon", user: "market", title: "포켓몬 카드 앨범 교환 기준 정리", content: "9포켓, 4포켓, 지퍼형 기준으로 장단점 정리했어요. 어린이 선물용이면 지퍼형이 안전합니다.", post_type: "info", like_count: 54, comment_count: 0, bookmark_count: 31 },
  { gallery: "onepiece", user: "onepiece", title: "기어5 루피 피규어 정품 구분 포인트", content: "박스 홀로그램, 받침대 마감, 머리카락 도색을 보면 대략 구분됩니다. 너무 싼 매물은 조심하세요.", post_type: "info", like_count: 112, comment_count: 0, bookmark_count: 48 },
  { gallery: "onepiece", user: "market", title: "그란디스타 루피 예약가 괜찮나요?", content: "배송비 포함 2만원대면 괜찮아 보이는데, 재판 가능성 있으면 기다릴지 고민입니다.", post_type: "purchase_help", like_count: 45, comment_count: 0, bookmark_count: 19 },
  { gallery: "webtoon-goods", user: "webtoon", title: "웹툰샵 아크릴 랜덤 챰 후기", content: "랜덤이라 중복이 좀 있지만 가격이 낮아서 교환하기 좋아요. 보호필름이 있어서 벗겨야 깨끗합니다.", post_type: "review", like_count: 73, comment_count: 0, bookmark_count: 35 },
  { gallery: "bts", user: "bts", title: "BTS 포토카드 바인더 특전 있는 곳 정리", content: "공식 MD와 외부몰 특전 차이가 있어서 표로 정리해봤어요. 유저 제보 링크도 확인 필요합니다.", post_type: "info", like_count: 152, comment_count: 1, bookmark_count: 73 },
  { gallery: "stellive", user: "stellive", title: "스텔라이브 STAR TRAIL 앨범 굿즈 링크 모음", content: "네이버 검색 결과에 같은 이미지로 여러 몰이 떠서 가격과 배송비 기준으로 비교했습니다.", post_type: "info", like_count: 66, comment_count: 0, bookmark_count: 27 },
  { gallery: "lol", user: "lol", title: "롤드컵 유니폼 사이즈 실측 공유", content: "평소 M 입는데 이번 유니폼은 어깨가 살짝 좁습니다. 교환글 올리기 전에 참고하세요.", post_type: "review", like_count: 76, comment_count: 0, bookmark_count: 29 }
];

const comments = [
  { postTitle: "[구매고민] 쿠로미 키링 정품 어디서 사?", user: "market", content: "공식몰은 비싸도 특전이 확실해서 저는 거기 추천해요.", like_count: 12 },
  { postTitle: "[구매고민] 쿠로미 키링 정품 어디서 사?", user: "sanrio", content: "네이버 판매처는 리뷰 확인하고 사는 게 좋아요.", like_count: 8 },
  { postTitle: "포켓몬 카드 바인더 360장짜리 써본 사람?", user: "pokemon", content: "슬리브 끼운 카드도 들어가는데 너무 꽉 채우면 휘어요.", like_count: 5 },
  { postTitle: "BTS 포토카드 바인더 특전 있는 곳 정리", user: "bts", content: "특전 있는 몰은 품절이 빨라서 알림 켜두는 게 좋더라고요.", like_count: 7 }
];

const marketItems = [
  { user: "sanrio", gallery: "sanrio", product: "kuromi-keyring", trade_type: "transfer", title: "쿠로미 얼굴 키링 미개봉 양도", description: "중복 구매해서 정가 이하로 양도합니다. 댓글 문의만 받아요.", price: 7000, region: "서울 홍대", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg" },
  { user: "pokemon", gallery: "pokemon", product: "pokemon-binder", trade_type: "exchange", title: "포켓몬 카드 바인더 교환 구해요", description: "9포켓 바인더를 지퍼형 바인더와 교환 희망합니다.", price: 0, region: "부산 서면", status: "reserved", image_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg" },
  { user: "onepiece", gallery: "onepiece", product: "onepiece-figure", trade_type: "giveaway", title: "원피스 루피 피규어 박스만 나눔", description: "피규어 박스 보관용으로 필요하신 분께 나눔합니다.", price: 0, region: "인천 부평", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg" },
  { user: "webtoon", gallery: "webtoon-goods", product: "webtoon-acrylic", trade_type: "exchange", title: "웹툰 아크릴 챰 중복 교환", description: "랜덤 챰 중복이 나와서 다른 캐릭터와 교환 원합니다.", price: 0, region: "서울 합정", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg" },
  { user: "bts", gallery: "bts", product: "bts-binder", trade_type: "giveaway", title: "BTS 포토카드 바인더 속지 나눔", description: "바인더 속지 여분이 있어 나눔합니다. 상태는 새상품입니다.", price: 0, region: "대구 동성로", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg" },
  { user: "stellive", gallery: "stellive", product: "stellive-album", trade_type: "exchange", title: "스텔라이브 앨범 특전 교환", description: "중복 특전이 있어 다른 멤버 특전과 교환하고 싶어요.", price: 0, region: "광주 충장로", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg" },
  { user: "lol", gallery: "lol", product: "lol-uniform", trade_type: "transfer", title: "롤드컵 유니폼 L 양도", description: "실착 1회, 상태 좋습니다. 사이즈 미스로 양도합니다.", price: 43000, region: "대전 둔산", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg" }
];

async function findAuthUser(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) break;
  }
  return null;
}

async function ensureAuthUsers() {
  const userIds = {};

  for (const user of seedUsers) {
    let authUser = await findAuthUser(user.email);

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.nickname }
      });
      if (error) throw error;
      authUser = data.user;
    } else {
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.nickname }
      });
    }

    userIds[user.key] = authUser.id;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authUser.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role
    });
    if (profileError) throw profileError;

    console.log(`AUTH ${user.email} / ${user.password} (${user.role})`);
  }

  return userIds;
}

async function seedGalleries() {
  const { error } = await supabase.from("galleries").upsert(galleries, { onConflict: "slug" });
  if (error) throw error;

  const { data, error: selectError } = await supabase.from("galleries").select("id, slug");
  if (selectError) throw selectError;

  return Object.fromEntries(data.map((gallery) => [gallery.slug, gallery.id]));
}

async function seedProducts() {
  const normalizedTitles = productSeeds.map((product) => product.normalized_title);
  const { data: oldProducts } = await supabase.from("products").select("id").in("normalized_title", normalizedTitles);
  if (oldProducts?.length) {
    await supabase.from("product_offers").delete().in("product_id", oldProducts.map((product) => product.id));
    await supabase.from("market_items").delete().in("product_id", oldProducts.map((product) => product.id));
    await supabase.from("products").delete().in("id", oldProducts.map((product) => product.id));
  }

  const productIds = {};
  for (const seed of productSeeds) {
    const { offers, key, ...product } = seed;
    const { data, error } = await supabase.from("products").insert(product).select("id").single();
    if (error) throw error;
    productIds[key] = data.id;

    const offerRows = offers.map((offer) => ({ ...offer, product_id: data.id }));
    const { error: offerError } = await supabase.from("product_offers").insert(offerRows);
    if (offerError) throw offerError;
  }

  return productIds;
}

async function clearOldContent(userIds) {
  const ids = Object.values(userIds);
  await supabase.from("comments").delete().in("user_id", ids);
  await supabase.from("posts").delete().in("user_id", ids);
  await supabase.from("market_items").delete().in("seller_id", ids);
}

async function seedPosts(userIds, galleryIds) {
  const postIdsByTitle = {};

  for (const post of posts) {
    const { gallery, user, ...rest } = post;
    const { data, error } = await supabase
      .from("posts")
      .insert({
        ...rest,
        gallery_id: galleryIds[gallery],
        user_id: userIds[user],
        view_count: Math.floor(rest.like_count * 12),
        is_deleted: false
      })
      .select("id, title")
      .single();
    if (error) throw error;
    postIdsByTitle[data.title] = data.id;
  }

  const commentRows = comments.map((comment) => ({
    post_id: postIdsByTitle[comment.postTitle],
    user_id: userIds[comment.user],
    content: comment.content,
    like_count: comment.like_count,
    is_deleted: false
  }));
  const { error } = await supabase.from("comments").insert(commentRows);
  if (error) throw error;
}

async function seedMarket(userIds, galleryIds, productIds) {
  const rows = marketItems.map((item) => ({
    seller_id: userIds[item.user],
    gallery_id: galleryIds[item.gallery],
    product_id: productIds[item.product],
    trade_type: item.trade_type,
    title: item.title,
    description: item.description,
    price: item.price,
    region: item.region,
    status: item.status,
    image_url: item.image_url
  }));

  const { error } = await supabase.from("market_items").insert(rows);
  if (error) throw error;
}

try {
  const userIds = await ensureAuthUsers();
  const galleryIds = await seedGalleries();
  await clearOldContent(userIds);
  const productIds = await seedProducts();
  await seedPosts(userIds, galleryIds);
  await seedMarket(userIds, galleryIds, productIds);

  console.log("\nSupabase demo seed complete.");
  console.log("Admin: gold3534@gmail.com / admin1234");
  console.log("User password for all demo accounts: semo1234");
} catch (error) {
  console.error(error);
  process.exit(1);
}
