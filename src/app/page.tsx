import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import {
  HomeInterestCarousel,
  type HomeInterestItem,
} from "@/app/home-interest-carousel";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel, tradeValueLabel } from "@/lib/format";
import { productFromDbRow, productSelect } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Gallery, Post, Product } from "@/types/domain";

export const dynamic = "force-dynamic";

type MarketPreview = {
  id: string;
  title: string;
  description?: string | null;
  trade_type: string;
  price: number;
  image_url: string | null;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

const directInterestSlugs: Record<string, string[]> = {
  bts: ["bts"],
  포켓몬: ["pokemon"],
  스텔라이브: ["stellive"],
  롤: ["lol"],
  산리오: ["sanrio"],
  원피스: ["onepiece"],
  지브리: ["ghibli"],
};

const broadInterestCategories = new Set([
  "게임",
  "애니",
  "웹툰",
  "캐릭터",
  "아이돌",
  "버튜버",
]);

const ignoredRecommendationInterests = new Set(["굿즈", "덕", "돌"]);

const defaultInterests = [
  "BTS",
  "포켓몬",
  "산리오",
  "쿠로미",
  "스텔라이브",
  "롤",
  "지브리",
  "원피스",
];

const interestKeywordMap: Record<string, string[]> = {
  BTS: ["BTS", "방탄소년단", "Weverse"],
  포켓몬: ["포켓몬", "Pokemon", "피카츄"],
  스텔라이브: ["스텔라이브", "Fanding"],
  지브리: ["지브리", "스튜디오 지브리", "도토리숲", "토토로", "키키", "하울"],
  롤: [
    "라이엇 스토어",
    "리그 오브 레전드",
    "League of Legends",
    "TFT",
    "요네",
    "아리",
    "티모",
  ],
  산리오: ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  쿠로미: ["쿠로미", "산리오"],
  원피스: ["원피스", "루피", "조로", "상디"],
  애니: ["원피스", "지브리", "애니", "피규어"],
  웹툰: ["웹툰프렌즈", "웹툰"],
  아이돌: ["BTS", "아이돌"],
  게임: ["라이엇 스토어", "리그 오브 레전드", "포켓몬", "이터널 리턴"],
  캐릭터: ["산리오", "포켓몬", "캐릭터"],
  피규어: ["피규어", "원피스", "라이엇 스토어"],
  버튜버: ["스텔라이브"],
};

function keywordsForInterests(interests: string[]) {
  const targets = interests.filter(
    (interest) => !ignoredRecommendationInterests.has(interest)
  );

  const keywords = targets.flatMap((interest) => [
    interest,
    ...(interestKeywordMap[interest] ?? []),
  ]);

  return [...new Set(keywords.filter(Boolean))];
}

function scoreByInterests(
  textParts: Array<string | null | undefined>,
  interests: string[]
) {
  const text = textParts.filter(Boolean).join(" ").toLowerCase();
  let score = 0;

  for (const interest of keywordsForInterests(interests)) {
    const normalized = interest.toLowerCase();

    if (!normalized) continue;
    if (ignoredRecommendationInterests.has(interest)) continue;

    if (text.includes(normalized)) {
      score += broadInterestCategories.has(interest) ? 1 : 10;
    }
  }

  return score;
}

function productPrice(product: Product) {
  const prices = product.offers
    .map((offer) => offer.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function officialRank(product: Product) {
  return Number(
    product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial)
  );
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

let homeBaseCache:
  | {
      expiresAt: number;
      data: Awaited<ReturnType<typeof getHomeBaseDataUncached>>;
    }
  | undefined;

async function getHomeBaseDataUncached() {
  const supabase = createDataSupabaseClient();

  const [productsResult, galleriesResult, postsResult, marketResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(productSelect)
        .order("is_official_product", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(160),

      supabase
        .from("galleries")
        .select(
          "id,name,slug,description,category,thumbnail_url,follower_count,post_count"
        )
        .order("follower_count", { ascending: false })
        .limit(30),

      supabase
        .from("posts")
        .select(
          "id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,galleries(slug),profiles(nickname)"
        )
        .eq("is_deleted", false)
        .order("like_count", { ascending: false })
        .limit(6),

      supabase
        .from("market_items")
        .select(
          "id,title,description,trade_type,price,image_url,galleries(name,slug)"
        )
        .in("status", ["active", "reserved"])
        .neq("trade_type", "transfer")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  return { productsResult, galleriesResult, postsResult, marketResult };
}

async function getHomeBaseData() {
  const now = Date.now();

  if (homeBaseCache && homeBaseCache.expiresAt > now) {
    return homeBaseCache.data;
  }

  const data = await getHomeBaseDataUncached();

  homeBaseCache = {
    data,
    expiresAt: now + 60_000,
  };

  return data;
}

async function getHomeData() {
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();

  const { data: auth } = (await authClient?.auth.getUser()) ?? {
    data: { user: null },
  };

  const { data: interestRows } = auth.user
    ? await supabase
        .from("user_interests")
        .select("interests(name)")
        .eq("user_id", auth.user.id)
    : { data: [] };

  const userInterests = (interestRows ?? [])
    .map((row: any) => {
      const interest = Array.isArray(row.interests)
        ? row.interests[0]
        : row.interests;

      return interest?.name as string | undefined;
    })
    .filter(Boolean) as string[];

  const interests = userInterests.length
    ? userInterests
    : shuffle(defaultInterests).slice(0, 3);

  const { productsResult, galleriesResult, postsResult, marketResult } =
    await getHomeBaseData();

  const rawProducts = (productsResult.data ?? []).map(productFromDbRow);

  const rawGalleries: Gallery[] = (galleriesResult.data ?? []).map(
    (gallery) => ({
      id: gallery.id,
      name: gallery.name,
      slug: gallery.slug,
      description: gallery.description,
      category: gallery.category,
      thumbnail: gallery.thumbnail_url ?? "/semoduck-icon.png",
      followerCount: gallery.follower_count ?? 0,
      postCount: gallery.post_count ?? 0,
      tags: [gallery.category].filter(Boolean),
    })
  );

  const directSlugs = new Set(
    interests.flatMap(
      (interest) =>
        directInterestSlugs[interest.toLowerCase()] ??
        directInterestSlugs[interest] ??
        []
    )
  );

  const officialProductPool = rawProducts.filter(
    (product) =>
      !product.id.startsWith("fallback-") &&
      (product.isOfficialProduct ||
        product.offers.some((offer) => offer.isOfficial)) &&
      product.offers.length > 0 &&
      Boolean(product.image) &&
      product.image !== "/placeholder-goods.svg"
  );

  const scoredProductPool = officialProductPool
    .map((product) => ({
      product,
      score:
        scoreByInterests(
          [
            product.title,
            product.brand,
            product.category,
            product.description,
            ...product.tags,
          ],
          interests
        ) +
        product.gallerySlugs.reduce(
          (sum, slug) => sum + (directSlugs.has(slug) ? 12 : 0),
          0
        ),
    }))
    .filter((item) => item.score > 0);

  const productPool = scoredProductPool.length
    ? scoredProductPool
    : officialProductPool.map((product) => ({ product, score: 1 }));

  const highScore = Math.max(0, ...productPool.map((item) => item.score));

  const primaryProductPool = productPool.filter(
    (item) => item.score >= Math.max(1, highScore - 4)
  );

  const products = (primaryProductPool.length ? primaryProductPool : productPool)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.product.bookmarkCount - a.product.bookmarkCount ||
        officialRank(b.product) - officialRank(a.product) ||
        productPrice(a.product) - productPrice(b.product)
    )
    .slice(0, 8)
    .map((item) => item.product);

  const recommendedGalleries = rawGalleries
    .map((gallery) => ({
      gallery,
      score:
        scoreByInterests(
          [
            gallery.name,
            gallery.category,
            gallery.description,
            gallery.slug,
            ...gallery.tags,
          ],
          interests
        ) + (directSlugs.has(gallery.slug) ? 20 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.gallery.followerCount - a.gallery.followerCount
    )
    .slice(0, 8)
    .map((item) => item.gallery);

  const galleries = [
    ...recommendedGalleries,
    ...rawGalleries.filter(
      (gallery) => !recommendedGalleries.some((item) => item.id === gallery.id)
    ),
  ].slice(0, 8);

  const posts: Post[] = (postsResult.data ?? []).map((post) => {
    const profile = Array.isArray(post.profiles)
      ? post.profiles[0]
      : post.profiles;

    const gallery = Array.isArray(post.galleries)
      ? post.galleries[0]
      : post.galleries;

    return {
      id: post.id,
      gallerySlug: gallery?.slug ?? "",
      title: post.title,
      author: profile?.nickname ?? "회원",
      type: post.post_type,
      content: post.content,
      tags: [],
      likeCount: post.like_count ?? 0,
      commentCount: post.comment_count ?? 0,
      bookmarkCount: post.bookmark_count ?? 0,
      createdAt: formatDateTime(post.created_at),
      image: "/semoduck-icon.png",
    };
  });

  const rawMarketItems: MarketPreview[] = (marketResult.data ?? []).map(
    (item) => ({
      ...item,
      galleries: Array.isArray(item.galleries)
        ? item.galleries[0]
        : item.galleries,
    })
  );

  const scoredMarketItems = rawMarketItems
    .map((market) => ({
      market,
      score:
        scoreByInterests(
          [
            market.title,
            market.description,
            market.galleries?.name,
            market.galleries?.slug,
          ],
          interests
        ) +
        (market.galleries?.slug && directSlugs.has(market.galleries.slug)
          ? 12
          : 0),
    }))
    .filter((item) => item.score > 0);

  const marketPool = scoredMarketItems.length
    ? scoredMarketItems
    : rawMarketItems.map((market) => ({ market, score: 1 }));

  const marketItems = marketPool
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(Boolean(b.market.image_url)) -
          Number(Boolean(a.market.image_url)) ||
        (b.market.price ?? 0) - (a.market.price ?? 0)
    )
    .slice(0, 8)
    .map((item) => item.market);

  const homePreviewMarketItems = marketItems.slice(0, 3);

  const interestItems: HomeInterestItem[] = shuffle([
    ...products.slice(0, 4).map((product) => ({
      kind: "official" as const,
      product,
    })),
    ...marketItems.slice(0, 4).map((market) => ({
      kind: "market" as const,
      market,
    })),
  ]);

  return {
    products,
    galleries,
    posts,
    marketItems: homePreviewMarketItems,
    interestItems,
    interests,
    isPersonalized: userInterests.length > 0,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;

  if (params?.code) {
    const callbackParams = new URLSearchParams({
      code: params.code,
      next: params.next ?? "/",
    });

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const {
    products,
    galleries,
    posts,
    marketItems,
    interestItems,
    interests,
    isPersonalized,
  } = await getHomeData();

  const keywords = [
    ...new Set([
      ...(interests.length ? interests : []),
      ...products.map((product) => product.category),
      ...galleries.map((gallery) => gallery.name),
    ]),
  ].slice(0, 10);

  const quickKeywords = keywords.length
    ? keywords
    : ["BTS", "산리오", "포켓몬", "원피스", "스텔라이브", "하이큐", "쿠로미", "키링"];

  const featureCards = [
    {
      title: "덕질 커뮤니티",
      body: "갤러리에서 덕질 친구들과 소통해요.",
      Icon: Heart,
    },
    {
      title: "굿즈 검색",
      body: "원하는 굿즈를 쉽고 빠르게 찾아요.",
      Icon: Search,
    },
    {
      title: "유저거래",
      body: "판매, 교환, 나눔으로 굿즈를 나눠요.",
      Icon: ShoppingBag,
    },
    {
      title: "AI 도움 글쓰기",
      body: "태그와 굿즈 추천을 도와줘요.",
      Icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-3 2xl:space-y-4 min-[1800px]:space-y-5">
      <section className="relative h-[240px] overflow-hidden rounded-[1.5rem] border-2 border-[#e5c7f1] shadow-[0_14px_38px_rgba(126,80,178,0.07)] md:h-[260px] 2xl:h-[280px] min-[1800px]:h-[300px]">
        <Image
          src="/semoduck-banner-frame.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 74rem"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/55 to-transparent" />

        <div className="relative z-10 flex h-full items-center p-5 2xl:p-7 min-[1800px]:p-9">
          <div className="max-w-md 2xl:max-w-xl min-[1800px]:max-w-2xl">
            <h1 className="banner-title text-3xl font-black leading-tight text-[#4a347e] 2xl:text-4xl min-[1800px]:text-5xl">
              세상의 모든 덕질,
              <br />
              <span className="text-[#ff6f9b]">세모덕</span>에서 한 번에!
            </h1>

            <p className="mt-3 text-sm font-bold leading-6 text-[#4f4564] 2xl:text-base 2xl:leading-7">
              굿즈 검색부터 덕질 이야기, 유저거래까지 당신의 덕질 라이프를 더 즐겁게 만들어줘요!
            </p>

            <div className="mt-4 flex flex-wrap gap-2 2xl:mt-5 2xl:gap-3">
              <Link
                href="/goods"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#6f4ab4] ring-1 ring-[#e5c7f1] 2xl:h-10 2xl:px-5 2xl:text-sm"
              >
                <Search size={16} /> 굿즈 검색
              </Link>

              <Link
                href="/galleries"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#208b89] ring-1 ring-[#bfe8e6] 2xl:h-10 2xl:px-5 2xl:text-sm"
              >
                <Star size={16} /> 갤러리 둘러보기
              </Link>

              <Link
                href="/market"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#ff5f8d] ring-1 ring-[#f4c5d7] 2xl:h-10 2xl:px-5 2xl:text-sm"
              >
                <Heart size={16} /> 유저거래 확인
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-[1.55fr_0.9fr]">
        <Card className="p-3 2xl:p-4 min-[1800px]:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#3a285f]">인기 갤러리</h2>
            <Link href="/galleries" className="text-xs font-black text-[#6f4ab4]">
              더보기
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 md:grid-cols-6 2xl:gap-3 min-[1800px]:gap-4">
            {galleries.slice(0, 6).map((gallery) => (
              <Link
                key={gallery.id}
                href={`/galleries/${gallery.slug}`}
                className="rounded-xl border border-[#f1dbe8] bg-[#fff8fb] p-1.5 text-center 2xl:p-2 min-[1800px]:p-2.5"
              >
                <div className="relative mx-auto h-12 overflow-hidden rounded-lg bg-[#f7f2fb] 2xl:h-16 min-[1800px]:h-20">
                  <SafeImage
                    src={gallery.thumbnail}
                    alt={gallery.name}
                    kind="gallery"
                    className="h-full w-full object-cover"
                  />
                </div>

                <p className="mt-1 line-clamp-1 text-xs font-black text-[#2f2352] 2xl:text-sm">
                  {gallery.name}
                </p>

                <p className="text-[11px] font-bold text-slate-500 2xl:text-xs">
                  {gallery.followerCount.toLocaleString("ko-KR")}명
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="relative p-3 2xl:p-4 min-[1800px]:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#3a285f]">오늘의 추천 키워드</h2>
            <Link href="/goods" className="text-xs font-black text-[#6f4ab4]">
              더보기
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickKeywords.map((keyword) => (
              <Link
                key={keyword}
                href={`/goods?q=${encodeURIComponent(keyword)}`}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#7a54b9] ring-1 ring-[#ead8f4] hover:bg-[#fff0f6]"
              >
                #{keyword}
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-[minmax(18rem,1fr)_minmax(18rem,1fr)] xl:grid-cols-3">
        <Card className="p-3 2xl:p-4 min-[1800px]:p-5">
          <HomeInterestCarousel items={interestItems} interests={interests} />

          {!isPersonalized ? (
            <p className="mt-3 rounded-xl bg-[#fff8fb] px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-[#f1dbe8]">
              로그인하지 않았거나 관심사가 없어 인기 관심사 기준으로 추천 중이에요.
            </p>
          ) : null}
        </Card>

        <Card className="p-3 2xl:p-4 min-[1800px]:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#3a285f]">최근 인기 게시글</h2>
            <Link href="/galleries" className="text-xs font-black text-[#6f4ab4]">
              더보기
            </Link>
          </div>

          <div className="divide-y divide-[#f1dbe8]">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-1.5 text-xs"
              >
                <Badge tone="pink">{postTypeLabel(post.type)}</Badge>

                <span className="line-clamp-1 font-bold text-[#2f2352]">
                  {post.title}
                </span>

                <span className="flex items-center gap-2 text-slate-500">
                  <Heart size={12} /> {post.likeCount}
                </span>
              </Link>
            ))}

            {!posts.length && (
              <p className="py-3 text-xs font-bold text-slate-500">
                아직 게시글이 없습니다.
              </p>
            )}
          </div>
        </Card>

        <Card className="relative overflow-hidden p-3 2xl:p-4 min-[1800px]:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#3a285f]">유저거래 핫딜</h2>
            <Link href="/market" className="text-xs font-black text-[#6f4ab4]">
              더보기
            </Link>
          </div>

          <div className="space-y-2">
            {marketItems.map((item) => (
              <Link
                key={item.id}
                href={`/market/${item.id}`}
                className="grid grid-cols-[3.5rem_1fr] gap-2 2xl:grid-cols-[4.25rem_1fr] 2xl:gap-3 min-[1800px]:grid-cols-[5rem_1fr]"
              >
                <div className="relative h-12 overflow-hidden rounded-xl bg-[#f7f2fb] 2xl:h-16 min-[1800px]:h-20">
                  <SafeImage
                    src={item.image_url}
                    alt={item.title}
                    kind="product"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-1 text-xs font-black text-[#2f2352] 2xl:text-sm">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs font-black text-[#ff5f8d] 2xl:text-sm">
                    {tradeValueLabel(item.trade_type, item.price)}
                  </p>

                  <p className="text-[11px] font-bold text-slate-500 2xl:text-xs">
                    {item.galleries?.name ?? "갤러리"}
                  </p>
                </div>
              </Link>
            ))}

            {!marketItems.length && (
              <p className="py-3 text-xs font-bold text-slate-500">
                아직 유저거래 글이 없습니다.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {featureCards.map(({ title, body, Icon }) => (
          <div
            key={title}
            className="flex gap-3 rounded-2xl bg-white/78 p-3 ring-1 ring-[#f1dbe8] 2xl:p-4 min-[1800px]:gap-4"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f3e8ff] text-[#8b61c8] 2xl:h-12 2xl:w-12">
              <Icon size={20} />
            </div>

            <div>
              <p className="text-sm font-black text-[#6f4ab4] 2xl:text-base">
                {title}
              </p>

              <p className="mt-0.5 text-xs font-bold leading-5 text-slate-500 2xl:text-sm 2xl:leading-6">
                {body}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}