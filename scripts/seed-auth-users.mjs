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

const seedAdminPassword = must(env.SEED_ADMIN_PASSWORD, "SEED_ADMIN_PASSWORD");
const seedUserPassword = must(env.SEED_USER_PASSWORD, "SEED_USER_PASSWORD");

const seedUsers = [
  { key: "admin", email: "gold3534@gmail.com", password: seedAdminPassword, nickname: "?몃え?뺢?由ъ옄", role: "admin" },
  { key: "sanrio", email: "gold3534+sanrio@gmail.com", password: seedUserPassword, nickname: "荑좊줈誘몄닔吏묎?", role: "user" },
  { key: "pokemon", email: "gold3534+pokemon@gmail.com", password: seedUserPassword, nickname: "移대뱶?뺣━?붿젙", role: "user" },
  { key: "onepiece", email: "gold3534+onepiece@gmail.com", password: seedUserPassword, nickname: "猷⑦뵾湲곗뼱5", role: "user" },
  { key: "webtoon", email: "gold3534+webtoon@gmail.com", password: seedUserPassword, nickname: "?앹뾽以꾩꽌?붿쨷", role: "user" },
  { key: "bts", email: "gold3534+bts@gmail.com", password: seedUserPassword, nickname: "蹂대씪MD", role: "user" },
  { key: "stellive", email: "gold3534+stellive@gmail.com", password: seedUserPassword, nickname: "蹂꾨튆援우쫰??, role: "user" },
  { key: "lol", email: "gold3534+lol@gmail.com", password: seedUserPassword, nickname: "誘몃뱶李⑥씠", role: "user" },
  { key: "market", email: "gold3534+market@gmail.com", password: seedUserPassword, nickname: "援먰솚?붿젙", role: "user" }
];

const galleries = [
  { name: "?곕━??媛ㅻ윭由?, slug: "sanrio", description: "荑좊줈誘? 留덉씠硫쒕줈?? ?쒕굹紐⑤· 援우쫰? ?ъ엯怨??뺣낫瑜??섎늻??怨듦컙", category: "罹먮┃??, thumbnail_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg", follower_count: 12430, post_count: 842 },
  { name: "?ъ폆紐?媛ㅻ윭由?, slug: "pokemon", description: "?ъ폆紐?移대뱶, ?ㅻ쭅, ?명삎, ?앹뾽?ㅽ넗???뚯떇??紐⑥븘??, category: "寃뚯엫", thumbnail_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg", follower_count: 9870, post_count: 620 },
  { name: "?먰뵾??媛ㅻ윭由?, slug: "onepiece", description: "?쇨퇋?? ?먰봽?? ?쒖젙???덉빟 ?뺣낫瑜?怨듭쑀?⑸땲??, category: "?좊땲", thumbnail_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg", follower_count: 7460, post_count: 411 },
  { name: "?뱁댆 援우쫰 媛ㅻ윭由?, slug: "webtoon-goods", description: "?뱁댆 ?⑦뻾蹂??뱀쟾, ?꾪겕由??ㅽ깲?? ?앹뾽 援우쫰 ?꾧린", category: "?뱁댆", thumbnail_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg", follower_count: 5320, post_count: 359 },
  { name: "BTS 媛ㅻ윭由?, slug: "bts", description: "?ы넗移대뱶, ?⑤쾾 ?뱀쟾, 怨듭떇 MD 援щℓ ?뺣낫瑜??뺣━?댁슂", category: "?꾩씠??, thumbnail_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg", follower_count: 15110, post_count: 1203 },
  { name: "?ㅽ뀛?쇱씠釉?媛ㅻ윭由?, slug: "stellive", description: "踰꾪뒠踰?援우쫰, 諛⑹넚 ?뱀쟾, 肄쒕씪蹂?移댄럹 ?댁빞湲곕? 紐⑥쑝??媛ㅻ윭由?, category: "踰꾪뒠踰?, thumbnail_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg", follower_count: 4310, post_count: 288 },
  { name: "濡?媛ㅻ윭由?, slug: "lol", description: "濡ㅻ뱶而?援우쫰, ? ?좊땲?? ?쇨퇋?댁? 援먰솚 ?뺣낫瑜?怨듭쑀?⑸땲??, category: "寃뚯엫", thumbnail_url: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg", follower_count: 6920, post_count: 503 }
];

const productSeeds = [
  {
    key: "kuromi-keyring",
    title: "?곕━??荑좊줈誘??쇨뎬 ?명삎 ?ㅻ쭅",
    normalized_title: "?곕━??荑좊줈誘??ㅻ쭅",
    brand: "?곕━??,
    category: "罹먮┃?곌동利?,
    description: "?ㅼ씠踰??쇳븨 寃곌낵 湲곕컲??荑좊줈誘??명삎 ?ㅻ쭅?낅땲??",
    image_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "21?멸린 臾몃갑援?, price: 4900, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/11346986476" },
      { source: "naver_shopping", mall_name: "The ?섎땲??, price: 11700, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/13249263774" }
    ]
  },
  {
    key: "pokemon-binder",
    title: "?ъ폆紐?移대뱶 9?ъ폆 諛붿씤??,
    normalized_title: "?ъ폆紐?移대뱶 諛붿씤??,
    brand: "?ъ폆紐?,
    category: "寃뚯엫援우쫰",
    description: "移대뱶 ?섏쭛??9?ъ폆 諛붿씤?붿엯?덈떎.",
    image_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "Basilisk", price: 8000, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/11080719169" },
      { source: "naver_shopping", mall_name: "?뉙뀥?≫솕??, price: 6700, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/6507549767" }
    ]
  },
  {
    key: "onepiece-figure",
    title: "?먰뵾??猷⑦뵾 湲곗뼱5 ?쇨퇋??,
    normalized_title: "?먰뵾??猷⑦뵾 湲곗뼱5 ?쇨퇋??,
    brand: "?먰뵾??,
    category: "?좊땲援우쫰",
    description: "猷⑦뵾 湲곗뼱5 ?붿옄???쇨퇋?댁엯?덈떎.",
    image_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    is_official_product: true,
    offers: [
      { source: "naver_shopping", mall_name: "?섍컙??, price: 23000, shipping_fee: 3000, condition: "new", is_official: true, is_used: false, url: "https://smartstore.naver.com/main/products/11717586939" },
      { source: "naver_shopping", mall_name: "?곕???, price: 19800, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/10333111816" }
    ]
  },
  {
    key: "webtoon-acrylic",
    title: "?ㅼ씠踰??뱁댆 ?꾪겕由??ㅽ깲???쒕뜡 梨?,
    normalized_title: "?뱁댆 ?꾪겕由??ㅽ깲??梨?,
    brand: "?뱁댆??,
    category: "?뱁댆援우쫰",
    description: "?뱁댆?듭뿉???먮ℓ?섎뒗 ?쒕뜡 ?꾪겕由??ㅽ깲??梨?援우쫰?낅땲??",
    image_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg",
    is_official_product: true,
    offers: [
      { source: "naver_shopping", mall_name: "?뱁댆??, price: 3000, shipping_fee: 3000, condition: "new", is_official: true, is_used: false, url: "https://smartstore.naver.com/main/products/392160127" },
      { source: "naver_shopping", mall_name: "?뱁댆??, price: 3500, shipping_fee: 3000, condition: "new", is_official: true, is_used: false, url: "https://smartstore.naver.com/main/products/4679439558" }
    ]
  },
  {
    key: "bts-binder",
    title: "BTS ?ы넗移대뱶 諛붿씤??,
    normalized_title: "BTS ?ы넗移대뱶 諛붿씤??,
    brand: "BTS",
    category: "?꾩씠?뚭동利?,
    description: "?ы넗移대뱶 蹂닿???諛붿씤?붿엯?덈떎.",
    image_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "GouShop", price: 17500, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/12142610372" },
      { source: "naver_shopping", mall_name: "KIWICK", price: 55000, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, special_benefit: "?щ쭏以?援우쫰", url: "https://smartstore.naver.com/main/products/8015303214" }
    ]
  },
  {
    key: "stellive-album",
    title: "?ㅽ뀛?쇱씠釉?STAR TRAIL ?⑤쾾 援우쫰",
    normalized_title: "?ㅽ뀛?쇱씠釉?STAR TRAIL ?⑤쾾",
    brand: "?ㅽ뀛?쇱씠釉?,
    category: "踰꾪뒠踰꾧동利?,
    description: "?ㅽ뀛?쇱씠釉??⑤쾾怨?愿??援우쫰?낅땲??",
    image_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "?ㅼ뺄?곗씠 ?쇰젆?몃┃", price: 19800, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/13384931910" },
      { source: "naver_shopping", mall_name: "洹?멸컯 二쇳뙆??, price: 19800, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/13384947686" }
    ]
  },
  {
    key: "lol-uniform",
    title: "濡ㅻ뱶而?T1 ?ㅽ????좊땲???먯폆",
    normalized_title: "濡ㅻ뱶而??좊땲???먯폆",
    brand: "T1",
    category: "寃뚯엫援우쫰",
    description: "濡ㅻ뱶而?遺꾩쐞湲곗쓽 ? ?좊땲???먯폆 ?곹뭹?낅땲??",
    image_url: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    is_official_product: false,
    offers: [
      { source: "naver_shopping", mall_name: "11踰덇?", price: 45500, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://www.11st.co.kr/connect/Gateway.tmall?method=Xsite&prdNo=9345655507&tid=1000000061" },
      { source: "naver_shopping", mall_name: "媛먮쭏利덈Т??긽??, price: 67790, shipping_fee: 3000, condition: "new", is_official: false, is_used: false, url: "https://smartstore.naver.com/main/products/11118978827" }
    ]
  }
];

const posts = [
  { gallery: "sanrio", user: "sanrio", title: "[援щℓ怨좊?] 荑좊줈誘??ㅻ쭅 ?뺥뭹 ?대뵒????", content: "?ㅼ씠踰꾩뿉 媛寃?李⑥씠媛 苑??섏꽌 怨듭떇紐곗씠??鍮꾧탳 以묒씠?먯슂. ?덉빟 ?뱀쟾 ?덈뒗 ?먮ℓ泥섎룄 ?덈굹??", post_type: "purchase_help", like_count: 128, comment_count: 2, bookmark_count: 56 },
  { gallery: "sanrio", user: "market", title: "?곕━???쇨뎬 ?명삎 ?ㅻ쭅 ?ㅻЪ ?꾧린", content: "媛諛⑹뿉 ?щ㈃ ?앷컖蹂대떎 ?쇱쭅?댁슂. ?ㅻ쾭鍮꾩쫰媛 ?ъ쭊蹂대떎 諛섏쭩?닿퀬 荑좊줈誘??됯컧??愿쒖갖?듬땲??", post_type: "review", like_count: 67, comment_count: 1, bookmark_count: 21 },
  { gallery: "pokemon", user: "pokemon", title: "?ъ폆紐?移대뱶 諛붿씤??360?μ쭨由??⑤낯 ?щ엺?", content: "諛붿떎由ъ뒪??諛붿씤?붽? 媛寃⑹? 愿쒖갖???移대뱶媛 ?섎뒗吏 沅곴툑?댁슂. ?щ━釉??쇱슫 ?곹깭濡??ㅼ뼱媛?섏슂?", post_type: "question", like_count: 89, comment_count: 1, bookmark_count: 22 },
  { gallery: "pokemon", user: "market", title: "?ъ폆紐?移대뱶 ?⑤쾾 援먰솚 湲곗? ?뺣━", content: "9?ъ폆, 4?ъ폆, 吏?쇳삎 湲곗??쇰줈 ?λ떒???뺣━?덉뼱?? ?대┛???좊Ъ?⑹씠硫?吏?쇳삎???덉쟾?⑸땲??", post_type: "info", like_count: 54, comment_count: 0, bookmark_count: 31 },
  { gallery: "onepiece", user: "onepiece", title: "湲곗뼱5 猷⑦뵾 ?쇨퇋???뺥뭹 援щ텇 ?ъ씤??, content: "諛뺤뒪 ?濡쒓렇?? 諛쏆묠? 留덇컧, 癒몃━移대씫 ?꾩깋??蹂대㈃ ???援щ텇?⑸땲?? ?덈Т ??留ㅻЪ? 議곗떖?섏꽭??", post_type: "info", like_count: 112, comment_count: 0, bookmark_count: 48 },
  { gallery: "onepiece", user: "market", title: "洹몃??붿뒪? 猷⑦뵾 ?덉빟媛 愿쒖갖?섏슂?", content: "諛곗넚鍮??ы븿 2留뚯썝?硫?愿쒖갖??蹂댁씠?붾뜲, ?ы뙋 媛?μ꽦 ?덉쑝硫?湲곕떎由댁? 怨좊??낅땲??", post_type: "purchase_help", like_count: 45, comment_count: 0, bookmark_count: 19 },
  { gallery: "webtoon-goods", user: "webtoon", title: "?뱁댆???꾪겕由??쒕뜡 梨??꾧린", content: "?쒕뜡?대씪 以묐났??醫 ?덉?留?媛寃⑹씠 ??븘??援먰솚?섍린 醫뗭븘?? 蹂댄샇?꾨쫫???덉뼱??踰쀪꺼??源⑤걮?⑸땲??", post_type: "review", like_count: 73, comment_count: 0, bookmark_count: 35 },
  { gallery: "bts", user: "bts", title: "BTS ?ы넗移대뱶 諛붿씤???뱀쟾 ?덈뒗 怨??뺣━", content: "怨듭떇 MD? ?몃?紐??뱀쟾 李⑥씠媛 ?덉뼱???쒕줈 ?뺣━?대뇬?댁슂. ?좎? ?쒕낫 留곹겕???뺤씤 ?꾩슂?⑸땲??", post_type: "info", like_count: 152, comment_count: 1, bookmark_count: 73 },
  { gallery: "stellive", user: "stellive", title: "?ㅽ뀛?쇱씠釉?STAR TRAIL ?⑤쾾 援우쫰 留곹겕 紐⑥쓬", content: "?ㅼ씠踰?寃??寃곌낵??媛숈? ?대?吏濡??щ윭 紐곗씠 ?좎꽌 媛寃⑷낵 諛곗넚鍮?湲곗??쇰줈 鍮꾧탳?덉뒿?덈떎.", post_type: "info", like_count: 66, comment_count: 0, bookmark_count: 27 },
  { gallery: "lol", user: "lol", title: "濡ㅻ뱶而??좊땲???ъ씠利??ㅼ륫 怨듭쑀", content: "?됱냼 M ?낅뒗???대쾲 ?좊땲?쇱? ?닿묠媛 ?댁쭩 醫곸뒿?덈떎. 援먰솚湲 ?щ━湲??꾩뿉 李멸퀬?섏꽭??", post_type: "review", like_count: 76, comment_count: 0, bookmark_count: 29 }
];

const comments = [
  { postTitle: "[援щℓ怨좊?] 荑좊줈誘??ㅻ쭅 ?뺥뭹 ?대뵒????", user: "market", content: "怨듭떇紐곗? 鍮꾩떥???뱀쟾???뺤떎?댁꽌 ???嫄곌린 異붿쿇?댁슂.", like_count: 12 },
  { postTitle: "[援щℓ怨좊?] 荑좊줈誘??ㅻ쭅 ?뺥뭹 ?대뵒????", user: "sanrio", content: "?ㅼ씠踰??먮ℓ泥섎뒗 由щ럭 ?뺤씤?섍퀬 ?щ뒗 寃?醫뗭븘??", like_count: 8 },
  { postTitle: "?ъ폆紐?移대뱶 諛붿씤??360?μ쭨由??⑤낯 ?щ엺?", user: "pokemon", content: "?щ━釉??쇱슫 移대뱶???ㅼ뼱媛?붾뜲 ?덈Т 苑?梨꾩슦硫??섏뼱??", like_count: 5 },
  { postTitle: "BTS ?ы넗移대뱶 諛붿씤???뱀쟾 ?덈뒗 怨??뺣━", user: "bts", content: "?뱀쟾 ?덈뒗 紐곗? ?덉젅??鍮⑤씪???뚮┝ 耳쒕몢??寃?醫뗫뜑?쇨퀬??", like_count: 7 }
];

const marketItems = [
  { user: "sanrio", gallery: "sanrio", product: "kuromi-keyring", trade_type: "transfer", title: "荑좊줈誘??쇨뎬 ?ㅻ쭅 誘멸컻遊??묐룄", description: "以묐났 援щℓ?댁꽌 ?뺢? ?댄븯濡??묐룄?⑸땲?? ?볤? 臾몄쓽留?諛쏆븘??", price: 7000, region: "?쒖슱 ?띾?", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg" },
  { user: "pokemon", gallery: "pokemon", product: "pokemon-binder", trade_type: "exchange", title: "?ъ폆紐?移대뱶 諛붿씤??援먰솚 援ы빐??, description: "9?ъ폆 諛붿씤?붾? 吏?쇳삎 諛붿씤?붿? 援먰솚 ?щ쭩?⑸땲??", price: 0, region: "遺???쒕㈃", status: "reserved", image_url: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg" },
  { user: "onepiece", gallery: "onepiece", product: "onepiece-figure", trade_type: "giveaway", title: "?먰뵾??猷⑦뵾 ?쇨퇋??諛뺤뒪留??섎닎", description: "?쇨퇋??諛뺤뒪 蹂닿??⑹쑝濡??꾩슂?섏떊 遺꾧퍡 ?섎닎?⑸땲??", price: 0, region: "?몄쿇 遺??, status: "active", image_url: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg" },
  { user: "webtoon", gallery: "webtoon-goods", product: "webtoon-acrylic", trade_type: "exchange", title: "?뱁댆 ?꾪겕由?梨?以묐났 援먰솚", description: "?쒕뜡 梨?以묐났???섏????ㅻⅨ 罹먮┃?곗? 援먰솚 ?먰빀?덈떎.", price: 0, region: "?쒖슱 ?⑹젙", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg" },
  { user: "bts", gallery: "bts", product: "bts-binder", trade_type: "giveaway", title: "BTS ?ы넗移대뱶 諛붿씤???띿? ?섎닎", description: "諛붿씤???띿? ?щ텇???덉뼱 ?섎닎?⑸땲?? ?곹깭???덉긽?덉엯?덈떎.", price: 0, region: "?援??숈꽦濡?, status: "active", image_url: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg" },
  { user: "stellive", gallery: "stellive", product: "stellive-album", trade_type: "exchange", title: "?ㅽ뀛?쇱씠釉??⑤쾾 ?뱀쟾 援먰솚", description: "以묐났 ?뱀쟾???덉뼱 ?ㅻⅨ 硫ㅻ쾭 ?뱀쟾怨?援먰솚?섍퀬 ?띠뼱??", price: 0, region: "愿묒＜ 異⑹옣濡?, status: "active", image_url: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg" },
  { user: "lol", gallery: "lol", product: "lol-uniform", trade_type: "transfer", title: "濡ㅻ뱶而??좊땲??L ?묐룄", description: "?ㅼ갑 1?? ?곹깭 醫뗭뒿?덈떎. ?ъ씠利?誘몄뒪濡??묐룄?⑸땲??", price: 43000, region: "????붿궛", status: "active", image_url: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg" }
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
  console.log("Admin seed user ready: gold3534@gmail.com");
  console.log("Seed user accounts are ready.");
} catch (error) {
  console.error(error);
  process.exit(1);
}

