import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, MessageCircle, ShoppingBag, Sparkles, Star } from "lucide-react";
import { HomeInterestCarousel, type HomeInterestItem } from "@/app/home-interest-carousel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel, tradeTypeLabel, tradeValueLabel } from "@/lib/format";
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
  원피스: ["onepiece"]
};

const broadInterestCategories = new Set(["게임", "애니", "웹툰", "캐릭터", "아이돌", "버튜버"]);
const ignoredRecommendationInterests = new Set(["굿즈", "덕", "돌"]);
const interestKeywordMap: Record<string, string[]> = {
  BTS: ["BTS", "방탄소년단", "Weverse"],
  포켓몬: ["포켓몬", "Pokemon", "피카츄"],
  스텔라이브: ["스텔라이브", "Fanding"],
  롤: ["라이엇 스토어", "리그 오브 레전드", "League of Legends", "TFT", "요네", "아리", "티모"],
  산리오: ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디", "폼폼푸린", "포차코"],
  원피스: ["원피스", "루피", "조로", "상디"],
  애니: ["원피스", "애니", "피규어"],
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
  const galleries = interests.length
    ? rawGalleries
        .map((gallery) => ({
          gallery,
          score: scoreByInterests([gallery.name, gallery.category, gallery.description, gallery.slug, ...gallery.tags], interests) + (directSlugs.has(gallery.slug) ? 20 : 0)
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || b.gallery.followerCount - a.gallery.followerCount)
        .slice(0, 3)
        .map((item) => item.gallery)
    : rawGalleries.slice(0, 3);
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
  return { products: displayProducts, galleries, posts, marketItems: homePreviewMarketItems, interestItems, interests };
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ code?: string; next?: string }> }) {
  const params = await searchParams;
  if (params?.code) {
    const callbackParams = new URLSearchParams({ code: params.code, next: params.next ?? "/" });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const { products, galleries, posts, marketItems, interestItems, interests } = await getHomeData();
  const keywords = [...new Set([...(interests.length ? interests : []), ...products.map((p) => p.category), ...galleries.map((g) => g.name)])].slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-2xl bg-ink p-6 text-white shadow-soft md:grid-cols-[1.25fr_0.75fr] md:p-10">
        <div className="flex min-h-[21rem] flex-col justify-between">
          <div>
            <Badge tone="sun">팬덤 굿즈 커뮤니티</Badge>
            <Image src="/semoduck-logo.svg" alt="세모덕" width={520} height={159} priority className="mt-5 h-auto w-full max-w-xs" />
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">추천 굿즈와 갤러리를 먼저 보여드려요</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">세모덕에서 굿즈 검색, 갤러리 이야기, 유저거래를 한 번에 확인하세요.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/goods" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-ink">굿즈 검색하기 <ArrowRight size={17} /></Link>
            <Link href="/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">글쓰기</Link>
          </div>
        </div>
        <div className="grid content-end gap-3">
          <Card className="bg-white/10 text-white ring-1 ring-white/15"><div className="flex items-center gap-2 text-sm font-black text-sun"><Sparkles size={17} /> 추천 기준</div><p className="mt-3 leading-7 text-white/80">{interests.length ? "마이페이지 관심사를 기준으로 갤러리를 추천합니다." : "관심사가 없는 계정에는 활동이 많은 갤러리와 기본 추천 굿즈를 보여줍니다."}</p></Card>
          <Card className="bg-white/10 text-white ring-1 ring-white/15"><div className="flex items-center gap-2 text-sm font-black text-mint"><Flame size={17} /> 추천 키워드</div><div className="mt-3 flex flex-wrap gap-2">{keywords.map((keyword) => <span key={keyword} className="rounded-full bg-white/12 px-3 py-1 text-sm font-bold">#{keyword}</span>)}</div></Card>
        </div>
      </section>

      <section>
        <HomeInterestCarousel items={interestItems} interests={interests} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div><div className="mb-4 flex items-end justify-between"><h2 className="text-2xl font-black">오늘의 인기글</h2><Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">갤러리로 이동</Link></div><div className="space-y-4">{posts.map((post) => <Link key={post.id} href={`/posts/${post.id}`} className="block"><Card className="transition hover:bg-pink-50"><div className="flex flex-wrap items-center gap-2"><Badge tone="pink">{postTypeLabel(post.type)}</Badge><span className="text-xs font-bold text-slate-500">{post.author}</span><span className="text-xs font-bold text-slate-400">{post.createdAt}</span></div><p className="mt-2 text-lg font-black text-ink">{post.title}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p><p className="mt-3 flex gap-4 text-sm font-bold text-slate-500"><span className="inline-flex items-center gap-1"><Star size={15} /> {post.likeCount}</span><span className="inline-flex items-center gap-1"><MessageCircle size={15} /> {post.commentCount}</span></p></Card></Link>)}{!posts.length && <Card>아직 게시글이 없습니다.</Card>}</div></div>
        <div><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ShoppingBag size={20} className="text-berry" /><h2 className="text-2xl font-black">최근 유저거래</h2></div><Link href="/market" className="text-sm font-black text-slate-500 hover:text-ink">유저거래로 이동</Link></div><div className="space-y-3">{marketItems.map((item) => <Link key={item.id} href={`/market/${item.id}`} className="block"><Card className="grid grid-cols-[4.5rem_1fr] gap-3 transition hover:bg-pink-50"><div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">{item.image_url ? <Image src={item.image_url} alt="" fill className="object-cover" sizes="72px" /> : null}</div><div className="min-w-0"><Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge><p className="mt-2 line-clamp-1 font-black">{item.title}</p><p className="mt-1 text-sm font-bold text-slate-500">{tradeValueLabel(item.trade_type, item.price)} · {item.galleries?.name ?? "갤러리"}</p></div></Card></Link>)}{!marketItems.length && <Card>아직 유저거래 글이 없습니다.</Card>}</div></div>
      </section>
    </div>
  );
}
