import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Grid3X3,
  Heart,
  MessageCircle,
  Package,
  PenLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store
} from "lucide-react";
import { HomeInterestCarousel, type HomeInterestItem } from "@/app/home-interest-carousel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, postTypeLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
import { fallbackRecommendedProducts, productFromDbRow, productSelect } from "@/lib/product-recommendations";
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
  지브리: ["ghibli"]
};

const broadInterestCategories = new Set(["게임", "애니", "웹툰", "캐릭터", "아이돌", "버튜버"]);
const ignoredRecommendationInterests = new Set(["굿즈", "덕", "돌"]);
const interestKeywordMap: Record<string, string[]> = {
  BTS: ["BTS", "방탄소년단", "Weverse"],
  포켓몬: ["포켓몬", "Pokemon", "피카츄"],
  스텔라이브: ["스텔라이브", "Fanding"],
  지브리: ["지브리", "스튜디오 지브리", "도토리숲", "토토로", "키키", "하울"],
  롤: ["라이엇 스토어", "리그 오브 레전드", "League of Legends", "TFT", "요네", "아리", "티모"],
  산리오: ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  원피스: ["원피스", "루피", "조로", "상디"],
  애니: ["원피스", "지브리", "애니", "피규어"],
  웹툰: ["웹툰프렌즈", "웹툰"],
  아이돌: ["BTS", "아이돌"],
  게임: ["라이엇 스토어", "리그 오브 레전드", "포켓몬", "이터널 리턴"],
  캐릭터: ["산리오", "포켓몬", "캐릭터"],
  피규어: ["피규어", "원피스", "라이엇 스토어"],
  버튜버: ["스텔라이브"]
};

function keywordsForInterests(interests: string[]) {
  const targets = interests.filter((interest) => !ignoredRecommendationInterests.has(interest));
  const keywords = targets.flatMap((interest) => [interest, ...(interestKeywordMap[interest] ?? [])]);
  return [...new Set(keywords.filter(Boolean))];
}

function scoreByInterests(textParts: Array<string | null | undefined>, interests: string[]) {
  const text = textParts.filter(Boolean).join(" ").toLowerCase();
  let score = 0;

  for (const interest of keywordsForInterests(interests)) {
    const normalized = interest.toLowerCase();
    if (!normalized) continue;
    if (ignoredRecommendationInterests.has(interest)) continue;
    if (text.includes(normalized)) score += broadInterestCategories.has(interest) ? 1 : 10;
  }

  return score;
}

function shuffled<T>(items: T[]) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function productPrice(product: Product) {
  const prices = product.offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

async function getHomeData() {
  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const { data: interestRows } = auth.user
    ? await supabase.from("user_interests").select("interests(name)").eq("user_id", auth.user.id)
    : { data: [] };
  const interests = (interestRows ?? [])
    .map((row: any) => {
      const interest = Array.isArray(row.interests) ? row.interests[0] : row.interests;
      return interest?.name as string | undefined;
    })
    .filter(Boolean) as string[];

  const [productsResult, galleriesResult, postsResult, marketResult] = await Promise.all([
    supabase.from("products").select(productSelect).order("is_official_product", { ascending: false }).order("created_at", { ascending: false }).limit(600),
    supabase.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").order("follower_count", { ascending: false }).limit(30),
    supabase.from("posts").select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,galleries(slug),profiles(nickname)").eq("is_deleted", false).order("like_count", { ascending: false }).limit(3),
    supabase.from("market_items").select("id,title,description,trade_type,price,image_url,galleries(name,slug)").in("status", ["active", "reserved"]).neq("trade_type", "transfer").order("created_at", { ascending: false }).limit(80)
  ]);

  const rawProducts = (productsResult.data ?? []).map(productFromDbRow);
  const rawGalleries: Gallery[] = (galleriesResult.data ?? []).map((gallery) => ({
    id: gallery.id,
    name: gallery.name,
    slug: gallery.slug,
    description: gallery.description,
    category: gallery.category,
    thumbnail: gallery.thumbnail_url ?? "/placeholder-goods.svg",
    followerCount: gallery.follower_count ?? 0,
    postCount: gallery.post_count ?? 0,
    tags: [gallery.category].filter(Boolean)
  }));

  const directSlugs = new Set(interests.flatMap((interest) => directInterestSlugs[interest.toLowerCase()] ?? directInterestSlugs[interest] ?? []));
  const officialProductPool = rawProducts.filter(
    (product) =>
      (product.isOfficialProduct || product.offers.some((offer) => offer.isOfficial)) &&
      product.offers.length > 0 &&
      Boolean(product.image) &&
      product.image !== "/placeholder-goods.svg"
  );
  const scoredProductPool = interests.length
    ? officialProductPool
        .map((product) => ({
          product,
          score:
            scoreByInterests([product.title, product.brand, product.category, product.description, ...product.tags], interests) +
            product.gallerySlugs.reduce((sum, slug) => sum + (directSlugs.has(slug) ? 12 : 0), 0)
        }))
        .filter((item) => item.score > 0)
    : officialProductPool.map((product) => ({ product, score: 1 }));
  const highScore = Math.max(0, ...scoredProductPool.map((item) => item.score));
  const primaryProductPool = scoredProductPool.filter((item) => item.score >= Math.max(1, highScore - 4));
  const products = shuffled(primaryProductPool.length ? primaryProductPool : scoredProductPool)
    .slice(0, 8)
    .map((item) => item.product);
  const recommendedGalleries = interests.length
    ? rawGalleries
        .map((gallery) => ({
          gallery,
          score: scoreByInterests([gallery.name, gallery.category, gallery.description, gallery.slug, ...gallery.tags], interests) + (directSlugs.has(gallery.slug) ? 20 : 0)
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || b.gallery.followerCount - a.gallery.followerCount)
        .slice(0, 8)
        .map((item) => item.gallery)
    : rawGalleries.slice(0, 8);
  const galleries = [...recommendedGalleries, ...rawGalleries.filter((gallery) => !recommendedGalleries.some((item) => item.id === gallery.id))].slice(0, 8);
  const newGalleries = [...rawGalleries].sort((a, b) => a.name.localeCompare(b.name, "ko-KR")).slice(0, 5);
  const posts: Post[] = (postsResult.data ?? []).map((post) => {
    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
    const gallery = Array.isArray(post.galleries) ? post.galleries[0] : post.galleries;
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
      image: "/placeholder-goods.svg"
    };
  });
  const rawMarketItems: MarketPreview[] = (marketResult.data ?? []).map((item) => ({ ...item, galleries: Array.isArray(item.galleries) ? item.galleries[0] : item.galleries }));
  const marketItems = interests.length
    ? rawMarketItems
        .map((market) => ({
          market,
          score: scoreByInterests([market.title, market.description, market.galleries?.name, market.galleries?.slug], interests) + (market.galleries?.slug && directSlugs.has(market.galleries.slug) ? 12 : 0)
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 16)
        .map((item) => item.market)
    : rawMarketItems.slice(0, 8);
  const randomMarketItems = shuffled(marketItems).slice(0, 8);
  const homePreviewMarketItems = randomMarketItems.slice(0, 3);
  const displayProducts = products.length ? products : fallbackRecommendedProducts(interests, 3);
  const interestItems: HomeInterestItem[] = [
    ...displayProducts.map((product) => ({ kind: "official" as const, product })),
    ...randomMarketItems.map((market) => ({ kind: "market" as const, market }))
  ];
  return { products: displayProducts, galleries, newGalleries, posts, marketItems: homePreviewMarketItems, interestItems, interests };
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ code?: string; next?: string }> }) {
  const params = await searchParams;
  if (params?.code) {
    const callbackParams = new URLSearchParams({ code: params.code, next: params.next ?? "/" });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const { products, galleries, posts, marketItems, interestItems, interests } = await getHomeData();
  const keywords = [...new Set([...(interests.length ? interests : []), ...products.map((p) => p.category), ...galleries.map((g) => g.name)])].slice(0, 6);
  const productCards = products.slice(0, 6);
  const quickKeywords = keywords.length ? keywords : ["쿠로미", "산리오", "포켓몬", "지브리", "롤"];
  const featureCards = [
    { title: "안전한 거래", body: "결제 없이 외부 링크와 유저거래 정보를 분리해서 보여줘요.", Icon: ShieldCheck },
    { title: "공식몰 우선", body: "DB에 저장된 공식 굿즈를 검색 결과 상단에 연결해요.", Icon: Store },
    { title: "덕질 글쓰기", body: "갤러리별 글과 상품 추천 흐름을 이어갈 수 있어요.", Icon: PenLine },
    { title: "찜하고 다시보기", body: "마이페이지에서 관심사와 찜한 굿즈를 관리해요.", Icon: Heart }
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border-2 border-[#ead0f4] bg-white/78 px-8 py-10 shadow-[0_18px_60px_rgba(126,80,178,0.08)] md:px-12 md:py-12">
        <Image src="/semoduck-goods-hero.png" alt="" fill priority className="pointer-events-none object-cover object-right opacity-45" sizes="1536px" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_25rem] lg:items-center">
          <div>
            <p className="inline-flex rounded-2xl bg-[#fff3d6] px-5 py-2 text-base font-black text-[#c46a13]">팬덤 굿즈 커뮤니티</p>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.08] text-[#6f4ab4] md:text-7xl">추천 굿즈와 갤러리를 먼저 보여드려요</h1>
            <p className="mt-6 max-w-2xl text-xl font-bold leading-9 text-[#4f4564]">세모덕에서 굿즈 검색, 갤러리 이야기, 유저거래를 한 번에 확인하세요.</p>
            <form action="/goods" className="mt-8 flex max-w-3xl items-center gap-3 rounded-full border-2 border-[#a36ce0] bg-white px-5 py-3 shadow-[0_14px_40px_rgba(163,108,224,0.14)]">
              <Search size={22} className="text-[#6f4ab4]" />
              <input name="q" className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-slate-400" placeholder="쿠로미 키링" />
              <button className="hidden rounded-full bg-[#ff6f9b] px-5 py-2 text-sm font-black text-white sm:inline-flex">검색</button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-bold text-[#5e4b76]">
              <span>인기 검색어</span>
              {quickKeywords.map((keyword) => (
                <Link key={keyword} href={`/goods?q=${encodeURIComponent(keyword)}`} className="rounded-full bg-white px-4 py-2 text-[#7a54b9] ring-1 ring-[#ead8f4] hover:bg-[#fff0f6]">
                  {keyword}
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/goods" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-[#3a285f] shadow-sm ring-1 ring-[#ead8f4]">
                굿즈 검색하기 <ArrowRight size={17} />
              </Link>
              <Link href="/posts/new" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff6f9b] to-[#a56be8] px-6 text-sm font-black text-white shadow-sm">
                <PenLine size={17} /> 글쓰기
              </Link>
              <Link href="/market" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-[#3a285f] shadow-sm ring-1 ring-[#ead8f4]">
                <ShoppingBag size={17} /> 유저거래
              </Link>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[#f2cddd] bg-white/72 p-5 shadow-[0_18px_55px_rgba(255,111,155,0.14)]">
            <div className="flex items-center gap-2 text-lg font-black text-[#6f4ab4]"><Sparkles size={22} /> 오늘의 추천</div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{interests.length ? "내 관심사와 맞는 공식 굿즈를 먼저 보여줘요." : "인기 굿즈와 최근 등록 상품을 섞어서 보여줘요."}</p>
            <div className="mt-5 grid gap-3">
              {productCards.slice(0, 3).map((product) => (
                <Link key={product.id} href={`/goods/${product.id}`} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-2xl border border-[#f4dbe7] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
                    {product.image ? <Image src={product.image} alt="" fill className="object-cover" sizes="80px" /> : <Package className="m-auto mt-6 text-[#b89dde]" />}
                  </div>
                  <div className="min-w-0">
                    <Badge tone="pink">공식</Badge>
                    <p className="mt-1 line-clamp-1 font-black text-[#2f2352]">{product.title}</p>
                    <p className="text-sm font-black text-[#ff5f8d]">{productPrice(product) ? formatPrice(productPrice(product)) : "가격 확인"}</p>
                  </div>
                  <ChevronRight size={18} className="text-[#8b61c8]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[#f1dbe8] bg-white/78 p-4 shadow-soft md:p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-[#ff6f9b]"><Grid3X3 size={16} /> 추천 굿즈</div>
            <h2 className="mt-1 text-2xl font-black text-[#2f2352]">내 관심사 기반 상품</h2>
          </div>
          <Link href="/goods" className="text-sm font-black text-[#6f4ab4]">더 보기</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {productCards.map((product) => (
            <Link key={product.id} href={`/goods/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#f1dbe8] bg-white transition hover:-translate-y-1 hover:shadow-soft">
              <div className="relative aspect-square bg-[#f7f2fb]">
                {product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="220px" /> : null}
                <span className="absolute left-3 top-3 rounded-full bg-[#9d6de1] px-3 py-1 text-xs font-black text-white">추천</span>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 min-h-11 font-black text-[#2f2352]">{product.title}</p>
                <p className="mt-2 text-lg font-black text-[#ff5f8d]">{productPrice(product) ? formatPrice(productPrice(product)) : "가격 확인"}</p>
                <p className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500"><span>{product.brand || product.category}</span><Heart size={18} className="text-[#ff7fa8]" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <HomeInterestCarousel items={interestItems} interests={interests} />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-3xl font-black text-[#2f2352]">오늘의 인기글</h2>
            <Link href="/galleries" className="text-sm font-black text-[#6f4ab4]">갤러리로 이동</Link>
          </div>
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-2xl border border-[#f1dbe8] bg-white/82 p-5 shadow-sm transition hover:bg-[#fff5fa]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="pink">{postTypeLabel(post.type)}</Badge>
                  <span className="text-xs font-bold text-slate-500">{post.author}</span>
                  <span className="text-xs font-bold text-slate-400">{post.createdAt}</span>
                </div>
                <p className="mt-3 text-xl font-black text-[#3a285f]">{post.title}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
                <p className="mt-4 flex gap-4 text-sm font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1"><Star size={15} /> {post.likeCount}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle size={15} /> {post.commentCount}</span>
                </p>
              </Link>
            ))}
            {!posts.length && <Card>아직 게시글이 없습니다.</Card>}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Store size={24} className="text-[#9d6de1]" /><h2 className="text-3xl font-black text-[#2f2352]">최근 유저거래</h2></div>
            <Link href="/market" className="text-sm font-black text-[#6f4ab4]">유저거래로 이동</Link>
          </div>
          <div className="space-y-3">
            {marketItems.map((item) => (
              <Link key={item.id} href={`/market/${item.id}`} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 rounded-2xl border border-[#f1dbe8] bg-white/82 p-4 shadow-sm transition hover:bg-[#fff5fa]">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f2fb]">
                  {item.image_url ? <Image src={item.image_url} alt="" fill className="object-cover" sizes="88px" /> : <ShoppingBag className="m-auto mt-7 text-[#b89dde]" />}
                </div>
                <div className="min-w-0">
                  <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                  <p className="mt-2 line-clamp-1 font-black text-[#3a285f]">{item.title}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{tradeValueLabel(item.trade_type, item.price)} · {item.galleries?.name ?? "갤러리"}</p>
                </div>
                <ChevronRight size={18} className="text-[#8b61c8]" />
              </Link>
            ))}
            {!marketItems.length && <Card>아직 유저거래 글이 없습니다.</Card>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.75rem] border border-[#f1dbe8] bg-white/76 p-5 shadow-sm md:grid-cols-4">
        {featureCards.map(({ title, body, Icon }) => (
          <div key={title} className="flex gap-3 rounded-2xl bg-[#fff8fb] p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f3e8ff] text-[#8b61c8]"><Icon size={22} /></div>
            <div><p className="font-black text-[#6f4ab4]">{title}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-500">{body}</p></div>
          </div>
        ))}
      </section>
    </div>
  );
}
