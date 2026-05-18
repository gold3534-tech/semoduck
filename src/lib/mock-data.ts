import type { EventItem, Gallery, MarketItem, Post, Product } from "@/types/domain";

export const interests = ["웹툰", "애니", "게임", "아이돌", "캐릭터", "피규어", "버튜버", "굿즈", "포켓몬", "BTS", "스텔라이브", "롤"];

export const galleries: Gallery[] = [
  {
    id: "g1",
    name: "산리오 갤러리",
    slug: "sanrio",
    description: "쿠로미, 마이멜로디, 시나모롤 굿즈와 재입고 정보를 나누는 공간",
    category: "캐릭터",
    thumbnail: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80",
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
    thumbnail: "https://images.unsplash.com/photo-1609372332255-611485350f25?auto=format&fit=crop&w=900&q=80",
    followerCount: 9870,
    postCount: 620,
    tags: ["피카츄", "카드", "팝업"]
  },
  {
    id: "g3",
    name: "원피스 갤러리",
    slug: "onepiece",
    description: "피규어, 점프샵, 한정판 예약 정보를 공유합니다",
    category: "애니",
    thumbnail: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=900&q=80",
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
    thumbnail: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80",
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
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
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
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    followerCount: 4310,
    postCount: 288,
    tags: ["버튜버", "콜라보", "카페"]
  },
  {
    id: "g7",
    name: "롤 갤러리",
    slug: "lol",
    description: "롤드컵 굿즈, 팀 유니폼, 피규어와 교환 정보를 공유합니다",
    category: "게임",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    followerCount: 6920,
    postCount: 503,
    tags: ["롤드컵", "유니폼", "스킨"]
  }
];

export const posts: Post[] = [
  {
    id: "p1",
    gallerySlug: "sanrio",
    title: "[구매고민] 쿠로미 아크릴 키링 정품 어디서 사?",
    author: "덕심가득",
    type: "purchase_help",
    content: "네이버에 가격 차이가 꽤 나서 공식몰이랑 비교 중이에요. 예약 특전 있는 판매처도 있나요?",
    tags: ["쿠로미", "키링", "산리오", "정품굿즈", "구매질문"],
    likeCount: 128,
    commentCount: 34,
    bookmarkCount: 56,
    createdAt: "2026-05-18",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "p2",
    gallerySlug: "pokemon",
    title: "피카츄 카드 바인더 새 버전 후기",
    author: "볼맞은트레이너",
    type: "review",
    content: "속지가 두껍고 카드가 덜 흔들려요. 다만 배송비 포함하면 공식샵이 오히려 낫습니다.",
    tags: ["포켓몬", "카드", "바인더", "후기"],
    likeCount: 89,
    commentCount: 18,
    bookmarkCount: 22,
    createdAt: "2026-05-17",
    image: "https://images.unsplash.com/photo-1609372332255-611485350f25?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "p3",
    gallerySlug: "bts",
    title: "포토카드 바인더 특전 있는 곳 정리",
    author: "보라해요",
    type: "info",
    content: "공식 MD와 외부몰 특전 차이가 있어서 표로 정리해봤어요. 유저 제보 링크도 확인 필요합니다.",
    tags: ["BTS", "포토카드", "바인더", "특전"],
    likeCount: 152,
    commentCount: 41,
    bookmarkCount: 73,
    createdAt: "2026-05-16",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "p4",
    gallerySlug: "lol",
    title: "롤드컵 유니폼 실측 공유",
    author: "미드차이",
    type: "review",
    content: "평소 M 입는데 이번 유니폼은 어깨가 살짝 좁습니다. 교환글 올리기 전에 참고하세요.",
    tags: ["롤", "롤드컵", "유니폼", "사이즈"],
    likeCount: 76,
    commentCount: 12,
    bookmarkCount: 29,
    createdAt: "2026-05-15",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80"
  }
];

export const products: Product[] = [
  {
    id: "prod1",
    title: "산리오 쿠로미 아크릴 키링",
    normalizedTitle: "산리오 쿠로미 아크릴 키링",
    brand: "산리오",
    category: "캐릭터굿즈",
    description: "쿠로미 일러스트가 들어간 아크릴 키링. 공식샵과 외부몰 가격을 비교할 수 있습니다.",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80",
    isOfficialProduct: true,
    tags: ["쿠로미", "산리오", "키링", "예약특전"],
    gallerySlugs: ["sanrio"],
    bookmarkCount: 342,
    offers: [
      { id: "o1", source: "official_shop", mallName: "산리오 공식몰", price: 12000, shippingFee: 3000, condition: "new", isOfficial: true, isUsed: false, specialBenefit: "예약 특전 스티커", url: "https://example.com/sanrio-official" },
      { id: "o2", source: "naver_shopping", mallName: "네이버 A몰", price: 10800, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://search.shopping.naver.com/search/all?query=%EC%BF%A0%EB%A1%9C%EB%AF%B8%20%ED%82%A4%EB%A7%81" },
      { id: "o3", source: "coupang", mallName: "쿠팡", price: 11500, shippingFee: 0, condition: "new", isOfficial: false, isUsed: false, url: "https://www.coupang.com/np/search?q=%EC%BF%A0%EB%A1%9C%EB%AF%B8%20%ED%82%A4%EB%A7%81" },
      { id: "o4", source: "internal_market", mallName: "세모덕 교환글", price: 7000, shippingFee: 0, condition: "used", isOfficial: false, isUsed: true, url: "/market" }
    ]
  },
  {
    id: "prod2",
    title: "포켓몬 카드 바인더 피카츄 에디션",
    normalizedTitle: "포켓몬 피카츄 카드 바인더",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "포켓몬 카드 보관용 바인더. 카드 수집러에게 인기 있는 상품입니다.",
    image: "https://images.unsplash.com/photo-1609372332255-611485350f25?auto=format&fit=crop&w=900&q=80",
    isOfficialProduct: true,
    tags: ["포켓몬", "피카츄", "카드", "바인더"],
    gallerySlugs: ["pokemon"],
    bookmarkCount: 220,
    offers: [
      { id: "o5", source: "official_shop", mallName: "포켓몬 스토어", price: 24000, shippingFee: 3000, condition: "new", isOfficial: true, isUsed: false, url: "https://example.com/pokemon-official" },
      { id: "o6", source: "naver_shopping", mallName: "네이버 B몰", price: 22900, shippingFee: 3000, condition: "new", isOfficial: false, isUsed: false, url: "https://search.shopping.naver.com/search/all?query=%ED%8F%AC%EC%BC%93%EB%AA%AC%20%EC%B9%B4%EB%93%9C%20%EB%B0%94%EC%9D%B8%EB%8D%94" }
    ]
  },
  {
    id: "prod3",
    title: "BTS 포토카드 바인더",
    normalizedTitle: "BTS 포토카드 바인더",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "포토카드 보관과 전시를 위한 바인더. 공식 MD 여부와 특전을 확인하세요.",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    isOfficialProduct: false,
    tags: ["BTS", "포토카드", "바인더", "특전"],
    gallerySlugs: ["bts"],
    bookmarkCount: 418,
    offers: [
      { id: "o7", source: "official_shop", mallName: "공식 MD샵", price: 18000, shippingFee: 3000, condition: "new", isOfficial: true, isUsed: false, specialBenefit: "포카 슬리브", url: "https://example.com/bts-official" },
      { id: "o8", source: "user_submission", mallName: "유저 제보 링크", price: 16000, shippingFee: 3000, condition: "opened_unused", isOfficial: false, isUsed: true, url: "https://example.com/user-link" }
    ]
  }
];

export const marketItems: MarketItem[] = [
  {
    id: "m1",
    title: "쿠로미 키링 미개봉 양도",
    tradeType: "transfer",
    status: "active",
    price: 7000,
    region: "서울 홍대",
    author: "멜로디수집가",
    gallerySlug: "sanrio",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80",
    description: "중복으로 구매해서 정가 이하로 양도합니다. 실제 결제는 지원하지 않으며 댓글 문의만 가능합니다."
  },
  {
    id: "m2",
    title: "피카츄 카드 바인더 교환 구해요",
    tradeType: "exchange",
    status: "reserved",
    price: 0,
    region: "부산 서면",
    author: "전기타입",
    gallerySlug: "pokemon",
    image: "https://images.unsplash.com/photo-1609372332255-611485350f25?auto=format&fit=crop&w=900&q=80",
    description: "꼬부기 에디션과 교환 희망합니다."
  },
  {
    id: "m3",
    title: "롤드컵 유니폼 L 판매",
    tradeType: "sell",
    status: "active",
    price: 43000,
    region: "대전 둔산",
    author: "미드차이",
    gallerySlug: "lol",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    description: "실착 1회, 상태 좋습니다."
  }
];

export const events: EventItem[] = [
  { id: "e1", gallerySlug: "sanrio", title: "쿠로미 공식몰 예약 마감", eventType: "reservation", endDate: "2026-05-22", url: "https://example.com" },
  { id: "e2", gallerySlug: "pokemon", title: "포켓몬 팝업스토어 종료", eventType: "popup_store", endDate: "2026-05-25", url: "https://example.com" },
  { id: "e3", gallerySlug: "bts", title: "포토카드 바인더 특전 응모", eventType: "etc", endDate: "2026-05-28", url: "https://example.com" }
];

export const comments = [
  { id: "c1", postId: "p1", author: "공식몰러", content: "공식몰은 비싸도 특전이 확실해서 저는 거기 추천해요.", likeCount: 12 },
  { id: "c2", postId: "p1", author: "가격비교러", content: "네이버 A몰은 리뷰 확인하고 사는 게 좋아요.", likeCount: 8 },
  { id: "c3", postId: "p2", author: "카드수집중", content: "속지 추가 구매 가능한지도 궁금했는데 도움 됐어요.", likeCount: 5 }
];
