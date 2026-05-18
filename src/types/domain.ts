export type PostType =
  | "general"
  | "question"
  | "review"
  | "purchase_help"
  | "info"
  | "trade"
  | "transfer"
  | "giveaway"
  | "notice";

export type OfferSource =
  | "official_shop"
  | "naver_shopping"
  | "coupang"
  | "user_submission"
  | "internal_market"
  | "external_search";

export type Gallery = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  followerCount: number;
  postCount: number;
  tags: string[];
};

export type Post = {
  id: string;
  gallerySlug: string;
  title: string;
  author: string;
  type: PostType;
  content: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  image: string;
};

export type ProductOffer = {
  id: string;
  source: OfferSource;
  mallName: string;
  price: number;
  shippingFee: number;
  condition: "new" | "used" | "opened_unused" | "damaged" | "unknown";
  isOfficial: boolean;
  isUsed: boolean;
  specialBenefit?: string;
  url: string;
};

export type Product = {
  id: string;
  title: string;
  normalizedTitle: string;
  brand: string;
  category: string;
  description: string;
  image: string;
  isOfficialProduct: boolean;
  tags: string[];
  gallerySlugs: string[];
  bookmarkCount: number;
  offers: ProductOffer[];
};

export type MarketItem = {
  id: string;
  title: string;
  tradeType: "sell" | "exchange" | "transfer" | "giveaway";
  status: "active" | "reserved" | "completed" | "hidden" | "reported";
  price: number;
  region: string;
  author: string;
  gallerySlug: string;
  image: string;
  description: string;
};

export type EventItem = {
  id: string;
  gallerySlug: string;
  title: string;
  eventType: "release" | "reservation" | "popup_store" | "concert" | "collaboration" | "restock" | "etc";
  endDate: string;
  url: string;
};
