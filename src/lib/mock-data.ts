import type { EventItem, Gallery, MarketItem, Post, Product } from "@/types/domain";

export const interests = ["웹툰", "애니", "게임", "아이돌", "캐릭터", "피규어", "버튜버", "굿즈", "포켓몬", "BTS", "스텔라이브", "롤"];

export const fakeUsers = [
  { id: "u1", email: "kuromi.fan@semoduck.dev", nickname: "쿠로미수집가" },
  { id: "u2", email: "cardbinder@semoduck.dev", nickname: "카드정리요정" },
  { id: "u3", email: "luffyfigure@semoduck.dev", nickname: "루피기어5" },
  { id: "u4", email: "webtoonpop@semoduck.dev", nickname: "팝업줄서는중" },
  { id: "u5", email: "purplemd@semoduck.dev", nickname: "보라MD" },
  { id: "u6", email: "stellivegoods@semoduck.dev", nickname: "별빛굿즈러" },
  { id: "u7", email: "lckuniform@semoduck.dev", nickname: "미드차이" },
  { id: "u8", email: "tradefairy@semoduck.dev", nickname: "교환요정" }
];

export const galleries: Gallery[] = [
  {
    id: "g1",
    name: "산리오 갤러리",
    slug: "sanrio",
    description: "쿠로미, 마이멜로디, 시나모롤 굿즈와 재입고 정보를 나누는 공간",
    category: "캐릭터",
    thumbnail: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    followerCount: 12430,
    postCount: 842,
    tags: ["쿠로미", "키링", "공식몰"]
  },
  {
    id: "g2",
    name: "포켓몬 갤러리",
    slug: "pokemon",
    description: "포켓몬 카드, 키링, 인형, 팝업스토어 소식을 모아요",
    category: "게임",
    thumbnail: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    followerCount: 9870,
    postCount: 620,
    tags: ["피카츄", "카드", "바인더"]
  },
  {
    id: "g3",
    name: "원피스 갤러리",
    slug: "onepiece",
    description: "피규어, 점프샵, 한정판 예약 정보를 공유합니다",
    category: "애니",
    thumbnail: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    followerCount: 7460,
    postCount: 411,
    tags: ["피규어", "예약", "정품"]
  },
  {
    id: "g4",
    name: "웹툰 굿즈 갤러리",
    slug: "webtoon-goods",
    description: "웹툰 단행본 특전, 아크릴 스탠드, 팝업 굿즈 후기",
    category: "웹툰",
    thumbnail: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg",
    followerCount: 5320,
    postCount: 359,
    tags: ["특전", "아크릴", "팝업"]
  },
  {
    id: "g5",
    name: "BTS 갤러리",
    slug: "bts",
    description: "포토카드, 앨범 특전, 공식 MD 구매 정보를 정리해요",
    category: "아이돌",
    thumbnail: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    followerCount: 15110,
    postCount: 1203,
    tags: ["포카", "앨범", "공식MD"]
  },
  {
    id: "g6",
    name: "스텔라이브 갤러리",
    slug: "stellive",
    description: "버튜버 굿즈, 방송 특전, 콜라보 카페 이야기를 모으는 갤러리",
    category: "버튜버",
    thumbnail: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    followerCount: 4310,
    postCount: 288,
    tags: ["버튜버", "앨범", "스타트레일"]
  },
  {
    id: "g7",
    name: "롤 갤러리",
    slug: "lol",
    description: "롤드컵 굿즈, 팀 유니폼, 피규어와 교환 정보를 공유합니다",
    category: "게임",
    thumbnail: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    followerCount: 6920,
    postCount: 503,
    tags: ["롤드컵", "유니폼", "LCK"]
  }
];

export const posts: Post[] = [
  {
    id: "p1",
    gallerySlug: "sanrio",
    title: "[구매고민] 쿠로미 키링 정품 어디서 사?",
    author: "쿠로미수집가",
    type: "purchase_help",
    content: "네이버에 가격 차이가 꽤 나서 공식몰이랑 비교 중이에요. 예약 특전 있는 판매처도 있나요?",
    tags: ["쿠로미", "키링", "산리오", "정품굿즈", "구매질문"],
    likeCount: 128,
    commentCount: 34,
    bookmarkCount: 56,
    createdAt: "2026-05-18",
    image: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg"
  },
  {
    id: "p2",
    gallerySlug: "sanrio",
    title: "산리오 얼굴 인형 키링 실물 후기",
    author: "멜로디백꾸",
    type: "review",
    content: "가방에 달면 생각보다 큼직해요. 실버비즈가 사진보다 반짝이고 쿠로미 색감도 괜찮습니다.",
    tags: ["산리오", "쿠로미", "백꾸", "후기"],
    likeCount: 67,
    commentCount: 15,
    bookmarkCount: 21,
    createdAt: "2026-05-18",
    image: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg"
  },
  {
    id: "p3",
    gallerySlug: "pokemon",
    title: "포켓몬 카드 바인더 360장짜리 써본 사람?",
    author: "카드정리요정",
    type: "question",
    content: "바실리스크 바인더가 가격은 괜찮은데 카드가 휘는지 궁금해요. 슬리브 끼운 상태로 들어가나요?",
    tags: ["포켓몬", "카드", "바인더", "질문"],
    likeCount: 89,
    commentCount: 18,
    bookmarkCount: 22,
    createdAt: "2026-05-17",
    image: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg"
  },
  {
    id: "p4",
    gallerySlug: "pokemon",
    title: "포켓몬 카드 앨범 교환 기준 정리",
    author: "피카츄정리함",
    type: "info",
    content: "9포켓, 4포켓, 지퍼형 기준으로 장단점 정리했어요. 어린이 선물용이면 지퍼형이 안전합니다.",
    tags: ["포켓몬", "카드앨범", "정리", "추천"],
    likeCount: 54,
    commentCount: 9,
    bookmarkCount: 31,
    createdAt: "2026-05-16",
    image: "https://shopping-phinf.pstatic.net/main_8405205/84052050100.5.jpg"
  },
  {
    id: "p5",
    gallerySlug: "onepiece",
    title: "기어5 루피 피규어 정품 구분 포인트",
    author: "루피기어5",
    type: "info",
    content: "박스 홀로그램, 받침대 마감, 머리카락 도색을 보면 대략 구분됩니다. 너무 싼 매물은 조심하세요.",
    tags: ["원피스", "루피", "피규어", "정품"],
    likeCount: 112,
    commentCount: 22,
    bookmarkCount: 48,
    createdAt: "2026-05-16",
    image: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg"
  },
  {
    id: "p6",
    gallerySlug: "onepiece",
    title: "그란디스타 루피 예약가 괜찮나요?",
    author: "상디는요리중",
    type: "purchase_help",
    content: "배송비 포함 2만원대면 괜찮아 보이는데, 재판 가능성 있으면 기다릴지 고민입니다.",
    tags: ["원피스", "그란디스타", "예약", "구매고민"],
    likeCount: 45,
    commentCount: 11,
    bookmarkCount: 19,
    createdAt: "2026-05-15",
    image: "https://shopping-phinf.pstatic.net/main_8787761/87877616027.jpg"
  },
  {
    id: "p7",
    gallerySlug: "webtoon-goods",
    title: "웹툰샵 아크릴 랜덤 챰 후기",
    author: "팝업줄서는중",
    type: "review",
    content: "랜덤이라 중복이 좀 있지만 가격이 낮아서 교환하기 좋아요. 보호필름이 있어서 벗겨야 깨끗합니다.",
    tags: ["웹툰", "아크릴", "랜덤", "후기"],
    likeCount: 73,
    commentCount: 14,
    bookmarkCount: 35,
    createdAt: "2026-05-15",
    image: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg"
  },
  {
    id: "p8",
    gallerySlug: "bts",
    title: "BTS 포토카드 바인더 특전 있는 곳 정리",
    author: "보라MD",
    type: "info",
    content: "공식 MD와 외부몰 특전 차이가 있어서 표로 정리해봤어요. 유저 제보 링크도 확인 필요합니다.",
    tags: ["BTS", "포토카드", "바인더", "특전"],
    likeCount: 152,
    commentCount: 41,
    bookmarkCount: 73,
    createdAt: "2026-05-14",
    image: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg"
  },
  {
    id: "p9",
    gallerySlug: "stellive",
    title: "스텔라이브 STAR TRAIL 앨범 굿즈 링크 모음",
    author: "별빛굿즈러",
    type: "info",
    content: "네이버 검색 결과에 같은 이미지로 여러 몰이 떠서 가격과 배송비 기준으로 비교했습니다.",
    tags: ["스텔라이브", "앨범", "굿즈", "스타트레일"],
    likeCount: 66,
    commentCount: 12,
    bookmarkCount: 27,
    createdAt: "2026-05-13",
    image: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg"
  },
  {
    id: "p10",
    gallerySlug: "lol",
    title: "롤드컵 유니폼 사이즈 실측 공유",
    author: "미드차이",
    type: "review",
    content: "평소 M 입는데 이번 유니폼은 어깨가 살짝 좁습니다. 교환글 올리기 전에 참고하세요.",
    tags: ["롤", "롤드컵", "유니폼", "사이즈"],
    likeCount: 76,
    commentCount: 12,
    bookmarkCount: 29,
    createdAt: "2026-05-12",
    image: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg"
  }
];

export const products: Product[] = [
  {
    id: "prod1",
    title: "산리오 쿠로미 얼굴 인형 키링",
    normalizedTitle: "산리오 쿠로미 키링",
    brand: "산리오",
    category: "캐릭터굿즈",
    description: "네이버 쇼핑 결과 기반의 쿠로미 인형 키링입니다. 백꾸용으로 많이 찾는 상품입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    isOfficialProduct: false,
    tags: ["쿠로미", "산리오", "키링", "백꾸"],
    gallerySlugs: ["sanrio"],
    bookmarkCount: 342,
    offers: [
      { id: "o1", source: "naver_shopping", mallName: "21세기 문방구", price: 4900, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/11346986476" },
      { id: "o2", source: "naver_shopping", mallName: "The 하니샵", price: 11700, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/13249263774" },
      { id: "o3", source: "internal_market", mallName: "세모덕 양도글", price: 7000, shippingFee: 0, condition: "used", isOfficial: false, isUsed: true, url: "/market" }
    ]
  },
  {
    id: "prod2",
    title: "포켓몬 카드 9포켓 바인더",
    normalizedTitle: "포켓몬 카드 바인더",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "카드 수집용 9포켓 바인더. 슬리브를 끼운 카드 보관용으로 검색량이 높은 상품입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    isOfficialProduct: false,
    tags: ["포켓몬", "카드", "바인더", "앨범"],
    gallerySlugs: ["pokemon"],
    bookmarkCount: 220,
    offers: [
      { id: "o4", source: "naver_shopping", mallName: "Basilisk", price: 8000, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/11080719169" },
      { id: "o5", source: "naver_shopping", mallName: "잇템잡화점", price: 6700, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/6507549767" }
    ]
  },
  {
    id: "prod3",
    title: "원피스 루피 기어5 피규어",
    normalizedTitle: "원피스 루피 기어5 피규어",
    brand: "원피스",
    category: "애니굿즈",
    description: "루피 기어5 디자인 피규어. 정품 여부와 판매처 리뷰 확인이 중요한 상품입니다.",
    image: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    isOfficialProduct: true,
    tags: ["원피스", "루피", "피규어", "기어5"],
    gallerySlugs: ["onepiece"],
    bookmarkCount: 186,
    offers: [
      { id: "o6", source: "naver_shopping", mallName: "페간샵", price: 23000, shippingFee: 3000, condition: "new", isOfficial: true, isUsed: false, url: "https://smartstore.naver.com/main/products/11717586939" },
      { id: "o7", source: "naver_shopping", mallName: "큰부자", price: 19800, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/10333111816" }
    ]
  },
  {
    id: "prod4",
    title: "네이버 웹툰 아크릴 스탠드 랜덤 챰",
    normalizedTitle: "웹툰 아크릴 스탠드 챰",
    brand: "웹툰샵",
    category: "웹툰굿즈",
    description: "웹툰샵에서 판매되는 랜덤 아크릴 스탠드/챰 굿즈입니다.",
    image: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg",
    isOfficialProduct: true,
    tags: ["웹툰", "아크릴", "스탠드", "랜덤"],
    gallerySlugs: ["webtoon-goods"],
    bookmarkCount: 144,
    offers: [
      { id: "o8", source: "naver_shopping", mallName: "웹툰샵", price: 3000, shippingFee: 3000, condition: "new", isOfficial: true, isUsed: false, url: "https://smartstore.naver.com/main/products/392160127" },
      { id: "o9", source: "naver_shopping", mallName: "웹툰샵", price: 3500, shippingFee: 3000, condition: "new", isOfficial: true, isUsed: false, url: "https://smartstore.naver.com/main/products/4679439558" }
    ]
  },
  {
    id: "prod5",
    title: "BTS 포토카드 바인더",
    normalizedTitle: "BTS 포토카드 바인더",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "포토카드 보관용 바인더. 공식 MD 여부와 특전 구성을 비교하세요.",
    image: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    isOfficialProduct: false,
    tags: ["BTS", "포토카드", "바인더", "특전"],
    gallerySlugs: ["bts"],
    bookmarkCount: 418,
    offers: [
      { id: "o10", source: "naver_shopping", mallName: "GouShop", price: 17500, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/12142610372" },
      { id: "o11", source: "naver_shopping", mallName: "KIWICK", price: 55000, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, specialBenefit: "달마중 굿즈", url: "https://smartstore.naver.com/main/products/8015303214" }
    ]
  },
  {
    id: "prod6",
    title: "스텔라이브 STAR TRAIL 앨범 굿즈",
    normalizedTitle: "스텔라이브 STAR TRAIL 앨범",
    brand: "스텔라이브",
    category: "버튜버굿즈",
    description: "스텔라이브 앨범과 관련 굿즈입니다. 동일 이미지 판매처의 가격을 비교합니다.",
    image: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    isOfficialProduct: false,
    tags: ["스텔라이브", "앨범", "굿즈", "STAR TRAIL"],
    gallerySlugs: ["stellive"],
    bookmarkCount: 121,
    offers: [
      { id: "o12", source: "naver_shopping", mallName: "스컬데이 일렉트릭", price: 19800, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/13384931910" },
      { id: "o13", source: "naver_shopping", mallName: "귀호강 주파수", price: 19800, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/13384947686" }
    ]
  },
  {
    id: "prod7",
    title: "롤드컵 T1 스타일 유니폼 자켓",
    normalizedTitle: "롤드컵 유니폼 자켓",
    brand: "T1",
    category: "게임굿즈",
    description: "롤드컵 분위기의 팀 유니폼/자켓 상품입니다. 사이즈와 판매처 신뢰도를 함께 확인하세요.",
    image: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    isOfficialProduct: false,
    tags: ["롤", "롤드컵", "유니폼", "자켓"],
    gallerySlugs: ["lol"],
    bookmarkCount: 201,
    offers: [
      { id: "o14", source: "naver_shopping", mallName: "11번가", price: 45500, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://www.11st.co.kr/connect/Gateway.tmall?method=Xsite&prdNo=9345655507&tid=1000000061" },
      { id: "o15", source: "naver_shopping", mallName: "감마즈무역상사", price: 67790, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://smartstore.naver.com/main/products/11118978827" }
    ]
  }
];

export const marketItems: MarketItem[] = [
  {
    id: "m1",
    title: "쿠로미 얼굴 키링 미개봉 양도",
    tradeType: "transfer",
    status: "active",
    price: 7000,
    region: "서울 홍대",
    author: "멜로디백꾸",
    gallerySlug: "sanrio",
    image: "https://shopping-phinf.pstatic.net/main_8889149/88891496807.10.jpg",
    description: "중복 구매해서 정가 이하로 양도합니다. 댓글 문의만 받아요."
  },
  {
    id: "m2",
    title: "포켓몬 카드 바인더 교환 구해요",
    tradeType: "exchange",
    status: "reserved",
    price: 0,
    region: "부산 서면",
    author: "카드정리요정",
    gallerySlug: "pokemon",
    image: "https://shopping-phinf.pstatic.net/main_8862522/88625229498.jpg",
    description: "9포켓 바인더를 지퍼형 바인더와 교환 희망합니다."
  },
  {
    id: "m3",
    title: "원피스 루피 피규어 박스만 나눔",
    tradeType: "giveaway",
    status: "active",
    price: 0,
    region: "인천 부평",
    author: "루피기어5",
    gallerySlug: "onepiece",
    image: "https://shopping-phinf.pstatic.net/main_8926209/89262097406.jpg",
    description: "피규어 박스 보관용으로 필요하신 분께 나눔합니다."
  },
  {
    id: "m4",
    title: "웹툰 아크릴 챰 중복 교환",
    tradeType: "exchange",
    status: "active",
    price: 0,
    region: "서울 합정",
    author: "팝업줄서는중",
    gallerySlug: "webtoon-goods",
    image: "https://shopping-phinf.pstatic.net/main_1208387/12083870773.jpg",
    description: "랜덤 챰 중복이 나와서 다른 캐릭터와 교환 원합니다."
  },
  {
    id: "m5",
    title: "BTS 포토카드 바인더 속지 나눔",
    tradeType: "giveaway",
    status: "active",
    price: 0,
    region: "대구 동성로",
    author: "보라MD",
    gallerySlug: "bts",
    image: "https://shopping-phinf.pstatic.net/main_8968712/89687121077.jpg",
    description: "바인더 속지 여분이 있어 나눔합니다. 상태는 새상품입니다."
  },
  {
    id: "m6",
    title: "스텔라이브 앨범 특전 교환",
    tradeType: "exchange",
    status: "active",
    price: 0,
    region: "광주 충장로",
    author: "별빛굿즈러",
    gallerySlug: "stellive",
    image: "https://shopping-phinf.pstatic.net/main_9092944/90929442246.jpg",
    description: "중복 특전이 있어 다른 멤버 특전과 교환하고 싶어요."
  },
  {
    id: "m7",
    title: "롤드컵 유니폼 L 양도",
    tradeType: "transfer",
    status: "active",
    price: 43000,
    region: "대전 둔산",
    author: "미드차이",
    gallerySlug: "lol",
    image: "https://shopping-phinf.pstatic.net/main_6001792/60017927980.jpg",
    description: "실착 1회, 상태 좋습니다. 사이즈 미스로 양도합니다."
  }
];

export const events: EventItem[] = [
  { id: "e1", gallerySlug: "sanrio", title: "쿠로미 공식몰 예약 마감", eventType: "reservation", endDate: "2026-05-22", url: "https://example.com" },
  { id: "e2", gallerySlug: "pokemon", title: "포켓몬 팝업스토어 종료", eventType: "popup_store", endDate: "2026-05-25", url: "https://example.com" },
  { id: "e3", gallerySlug: "bts", title: "포토카드 바인더 특전 응모", eventType: "etc", endDate: "2026-05-28", url: "https://example.com" }
];

export const comments = [
  { id: "c1", postId: "p1", author: "공식몰러", content: "공식몰은 비싸도 특전이 확실해서 저는 거기 추천해요.", likeCount: 12 },
  { id: "c2", postId: "p1", author: "가격비교러", content: "네이버 판매처는 리뷰 확인하고 사는 게 좋아요.", likeCount: 8 },
  { id: "c3", postId: "p3", author: "카드수집중", content: "슬리브 끼운 카드도 들어가는데 너무 꽉 채우면 휘어요.", likeCount: 5 },
  { id: "c4", postId: "p8", author: "포카정리함", content: "특전 있는 몰은 품절이 빨라서 알림 켜두는 게 좋더라고요.", likeCount: 7 }
];
