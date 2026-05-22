export type GalleryOfficialSource = {
  slug: string;
  officialSiteUrl: string;
  officialShopUrl?: string;
  shopLabel?: string;
  notes?: string;
};

export const galleryOfficialSources: GalleryOfficialSource[] = [
  {
    slug: "bts",
    officialSiteUrl: "https://www.instagram.com/bts.bighitofficial/",
    officialShopUrl: "https://weverseshop.io/",
    shopLabel: "Weverse Shop",
    notes: "공식 소식 채널은 BTS 공식 인스타그램, 공식 MD는 Weverse Shop을 우선 확인합니다."
  },
  {
    slug: "sanrio",
    officialSiteUrl: "https://www.instagram.com/sanrio_kr/",
    officialShopUrl: "https://search.shopping.naver.com/ns/search?query=%EC%82%B0%EB%A6%AC%EC%98%A4&mallTypes=OFFICIAL_BRAND",
    shopLabel: "네이버 공식 브랜드스토어 검색",
    notes: "한국 최신 소식은 산리오코리아 공식 인스타그램, 상품 후보는 네이버 공식 브랜드스토어 검색을 우선 확인합니다."
  },
  {
    slug: "pokemon",
    officialSiteUrl: "https://www.instagram.com/pokemon_korea_official/",
    officialShopUrl: "https://www.pokemonstore.co.kr/",
    shopLabel: "Pokemon Store Korea",
    notes: "한국 최신 소식은 포켓몬코리아 공식 인스타그램, 공식 상품은 포켓몬스토어 코리아를 우선 확인합니다."
  },
  {
    slug: "onepiece",
    officialSiteUrl: "https://www.instagram.com/onepiece_korea_official/",
    officialShopUrl: "https://www.daewonshop.com/",
    shopLabel: "대원샵",
    notes: "한국 소식은 원피스 한국 공식 인스타그램, 한국 사용자 구매 동선은 대원샵을 우선 확인합니다."
  },
  {
    slug: "webtoon-goods",
    officialSiteUrl: "https://www.instagram.com/naver_webtoon/",
    officialShopUrl: "https://brand.naver.com/webtoonfriends",
    shopLabel: "WEBTOON FRIENDS",
    notes: "네이버웹툰 공식 인스타그램과 WEBTOON FRIENDS 공식 굿즈 스토어를 우선 확인합니다."
  },
  {
    slug: "stellive",
    officialSiteUrl: "https://x.com/stellive_kr",
    officialShopUrl: "https://fanding.kr/@stellive/shop",
    shopLabel: "스텔라이브 Fanding Shop",
    notes: "스텔라이브는 공식 X와 Fanding 공식 판매샵을 함께 확인합니다."
  },
  {
    slug: "lol",
    officialSiteUrl: "https://www.instagram.com/leagueoflegendskorea/",
    officialShopUrl: "https://brand.naver.com/riot-store/category/f65ad626f5db4ea187f5a804dd2ce156?st=POPULAR&dt=BIG_IMAGE&page=1&size=40",
    shopLabel: "Riot Store 네이버 공식 브랜드스토어",
    notes: "한국 소식은 리그 오브 레전드 한국 공식 인스타그램, 상품은 Riot Store 네이버 공식 브랜드스토어를 우선 확인합니다."
  },
  {
    slug: "eternal-return",
    officialSiteUrl: "https://x.com/_EternalReturn_",
    officialShopUrl: "https://estar-egg.com/product/list.html?cate_no=43",
    shopLabel: "ESTAR EGG 이터널 리턴 공식굿즈",
    notes: "공식 X와 ESTAR EGG 공식굿즈 카테고리를 함께 확인합니다."
  },
  {
    slug: "ghibli",
    officialSiteUrl: "https://www.instagram.com/dotorisup/reels/",
    officialShopUrl: "https://www.dotorisup.com/",
    shopLabel: "도토리숲",
    notes: "도토리숲 공식 인스타그램과 공식샵 상품을 우선 확인합니다."
  }
];

export function officialSourceForGallery(slug: string) {
  return galleryOfficialSources.find((source) => source.slug === slug);
}
