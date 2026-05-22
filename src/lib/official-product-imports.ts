import type { OfferSource } from "@/types/domain";

export type OfficialProductCandidate = {
  key: string;
  gallerySlug: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  imageUrl?: string;
  mallName: string;
  price: number;
  shippingFee: number;
  url: string;
  source: OfferSource;
  availabilityLabel?: string;
};

export const officialProductCandidates: OfficialProductCandidate[] = [
  {
    key: "bts-weverse-md",
    gallerySlug: "bts",
    title: "BTS 공식 MD",
    brand: "BTS",
    category: "아이돌굿즈",
    description: "Weverse Shop에서 확인하는 BTS 공식 MD입니다.",
    mallName: "Weverse Shop",
    price: 0,
    shippingFee: 0,
    url: "https://weverseshop.io/",
    source: "official_shop"
  },
  {
    key: "sanrio-official-goods",
    gallerySlug: "sanrio",
    title: "산리오 공식 브랜드스토어 상품",
    brand: "산리오",
    category: "캐릭터굿즈",
    description: "네이버 쇼핑 공식 브랜드스토어 필터로 확인하는 산리오 상품 후보입니다.",
    mallName: "네이버 공식 브랜드스토어 검색",
    price: 0,
    shippingFee: 0,
    url: "https://search.shopping.naver.com/ns/search?query=%EC%82%B0%EB%A6%AC%EC%98%A4&mallTypes=OFFICIAL_BRAND",
    source: "naver_shopping"
  },
  {
    key: "pokemon-store-korea-goods",
    gallerySlug: "pokemon",
    title: "포켓몬스토어 코리아 공식 굿즈",
    brand: "포켓몬",
    category: "게임굿즈",
    description: "포켓몬스토어 코리아에서 확인하는 포켓몬 공식 굿즈입니다.",
    mallName: "Pokemon Store Korea",
    price: 0,
    shippingFee: 0,
    url: "https://www.pokemonstore.co.kr/",
    source: "official_shop"
  },
  {
    key: "onepiece-daewonshop-goods",
    gallerySlug: "onepiece",
    title: "원피스 대원샵 공식 굿즈",
    brand: "원피스",
    category: "애니굿즈",
    description: "대원샵에서 확인하는 원피스 공식 굿즈입니다.",
    mallName: "대원샵",
    price: 0,
    shippingFee: 0,
    url: "https://www.daewonshop.com/",
    source: "official_shop"
  },
  {
    key: "webtoon-friends-goods",
    gallerySlug: "webtoon-goods",
    title: "웹툰프렌즈 공식 굿즈",
    brand: "네이버웹툰",
    category: "웹툰굿즈",
    description: "WEBTOON FRIENDS에서 확인하는 네이버웹툰 공식 굿즈입니다.",
    mallName: "WEBTOON FRIENDS",
    price: 0,
    shippingFee: 0,
    url: "https://brand.naver.com/webtoonfriends",
    source: "official_shop"
  },
  {
    key: "riot-store-korea-goods",
    gallerySlug: "lol",
    title: "Riot Store 네이버 공식 브랜드스토어 상품",
    brand: "League of Legends",
    category: "게임굿즈",
    description: "Riot Store 네이버 공식 브랜드스토어에서 확인하는 리그 오브 레전드 상품입니다.",
    mallName: "Riot Store",
    price: 0,
    shippingFee: 0,
    url: "https://brand.naver.com/riot-store/category/f65ad626f5db4ea187f5a804dd2ce156?st=POPULAR&dt=BIG_IMAGE&page=1&size=40",
    source: "naver_shopping",
    availabilityLabel: "공식 브랜드스토어"
  },
  {
    key: "eternal-return-estar-goods",
    gallerySlug: "이터널리턴",
    title: "이터널 리턴 공식 굿즈",
    brand: "이터널 리턴",
    category: "게임굿즈",
    description: "ESTAR EGG에서 확인하는 이터널 리턴 공식굿즈입니다.",
    mallName: "ESTAR EGG",
    price: 0,
    shippingFee: 0,
    url: "https://estar-egg.com/product/list.html?cate_no=43",
    source: "official_shop"
  },
  {
    key: "stellive-fanding-goods",
    gallerySlug: "stellive",
    title: "스텔라이브 공식 굿즈",
    brand: "스텔라이브",
    category: "버튜버굿즈",
    description: "Fanding 스텔라이브 샵에서 확인하는 공식 굿즈입니다.",
    mallName: "Fanding 스텔라이브",
    price: 0,
    shippingFee: 0,
    url: "https://fanding.kr/@stellive/shop",
    source: "official_shop"
  }
];

export function officialProductCandidatesForGallery(gallerySlug?: string | null) {
  if (!gallerySlug) return officialProductCandidates;
  return officialProductCandidates.filter((candidate) => candidate.gallerySlug === gallerySlug);
}
