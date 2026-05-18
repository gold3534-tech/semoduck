import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, MessageCircle, ShoppingBag, Sparkles, Star } from "lucide-react";
import { GalleryCard } from "@/components/gallery-card";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, postTypeLabel, tradeTypeLabel } from "@/lib/format";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Gallery, Post, Product } from "@/types/domain";

type MarketPreview = {
  id: string;
  title: string;
  trade_type: string;
  price: number;
  image_url: string | null;
  created_at: string;
  galleries?: { name?: string | null; slug?: string | null } | null;
};

function mapProduct(product: any): Product {
  return {
    id: product.id,
    title: product.title,
    normalizedTitle: product.normalized_title,
    brand: product.brand ?? "",
    category: product.category,
    description: product.description ?? "",
    image: product.image_url ?? "/placeholder-goods.svg",
    isOfficialProduct: product.is_official_product ?? false,
    tags: [product.category, product.brand].filter(Boolean) as string[],
    gallerySlugs: [],
    bookmarkCount: product.bookmark_count ?? 0,
    offers: ((product.product_offers ?? []) as Array<{
      id: string;
      source: Product["offers"][number]["source"];
      mall_name: string;
      price: number;
      shipping_fee: number;
      condition: Product["offers"][number]["condition"];
      is_official: boolean;
      is_used: boolean;
      special_benefit?: string | null;
      url: string;
    }>).map((offer) => ({
      id: offer.id,
      source: offer.source,
      mallName: offer.mall_name,
      price: offer.price,
      shippingFee: offer.shipping_fee,
      condition: offer.condition,
      isOfficial: offer.is_official,
      isUsed: offer.is_used,
      specialBenefit: offer.special_benefit ?? undefined,
      url: offer.url
    }))
  };
}

async function getUserInterests() {
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  if (!userData.user) return [];

  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("user_interests").select("interests(name)").eq("user_id", userData.user.id);
  return ((data ?? []) as Array<{ interests?: { name?: string } | Array<{ name?: string }> | null }>)
    .map((row) => (Array.isArray(row.interests) ? row.interests[0]?.name : row.interests?.name))
    .filter(Boolean) as string[];
}

async function getHomeData() {
  const admin = createAdminSupabaseClient();
  const interests = await getUserInterests();
  const keyword = interests[0] ?? "";
  const productQuery = admin
    .from("products")
    .select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)")
    .limit(3);

  const galleryQuery = admin.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").limit(3);

  const [recommendedProductsResult, recommendedGalleriesResult, postsResult, marketResult] = await Promise.all([
    keyword
      ? productQuery.or(`title.ilike.%${keyword}%,category.ilike.%${keyword}%,brand.ilike.%${keyword}%`)
      : productQuery.order("created_at", { ascending: false }),
    keyword ? galleryQuery.or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%,description.ilike.%${keyword}%`) : galleryQuery.order("follower_count", { ascending: false }),
    admin
      .from("posts")
      .select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,galleries(slug),profiles(nickname)")
      .eq("is_deleted", false)
      .order("like_count", { ascending: false })
      .order("comment_count", { ascending: false })
      .limit(3),
    admin
      .from("market_items")
      .select("id,title,trade_type,price,image_url,created_at,galleries(name,slug)")
      .in("status", ["active", "reserved"])
      .neq("trade_type", "transfer")
      .order("created_at", { ascending: false })
      .limit(4)
  ]);

  let products = (recommendedProductsResult.data ?? []).map(mapProduct);
  if (!products.length) {
    const { data } = await admin
      .from("products")
      .select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)")
      .order("created_at", { ascending: false })
      .limit(3);
    products = (data ?? []).map(mapProduct);
  }

  let galleries: Gallery[] = (recommendedGalleriesResult.data ?? []).map((gallery) => ({
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
  if (!galleries.length) {
    const { data } = await admin.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").order("follower_count", { ascending: false }).limit(3);
    galleries = (data ?? []).map((gallery) => ({
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
  }

  const posts: Post[] = (postsResult.data ?? []).map((post) => {
    const gallery = Array.isArray(post.galleries) ? post.galleries[0] : post.galleries;
    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
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

  const marketItems: MarketPreview[] = (marketResult.data ?? []).map((item) => ({
    ...item,
    galleries: Array.isArray(item.galleries) ? item.galleries[0] ?? null : item.galleries
  }));

  return { interests, galleries, posts, products, marketItems };
}

export default async function HomePage() {
  const { interests, galleries, posts, products, marketItems } = await getHomeData();
  const keywords = [...new Set([...(interests.length ? interests : []), ...galleries.map((gallery) => gallery.name)])].slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-2xl bg-ink p-6 text-white shadow-soft md:grid-cols-[1.25fr_0.75fr] md:p-10">
        <div className="flex min-h-[21rem] flex-col justify-between">
          <div>
            <Badge tone="sun">팬덤 굿즈 커뮤니티</Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">관심사에 맞는 굿즈와 갤러리를 먼저 보여드려요</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              마이페이지에서 설정한 관심 태그를 바탕으로 추천 굿즈, 추천 갤러리, 인기글, 유저거래 글을 한 화면에서 확인하세요.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/goods" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-ink">
              굿즈 검색하기 <ArrowRight size={17} />
            </Link>
            <Link href="/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">
              글쓰기
            </Link>
          </div>
        </div>
        <div className="grid content-end gap-3">
          <Card className="bg-white/10 text-white ring-1 ring-white/15">
            <div className="flex items-center gap-2 text-sm font-black text-sun">
              <Sparkles size={17} />
              추천 기준
            </div>
            <p className="mt-3 leading-7 text-white/80">
              {interests.length ? `현재 관심 태그: ${interests.slice(0, 4).join(", ")}` : "마이페이지에서 관심 태그를 설정하면 추천이 더 정확해집니다."}
            </p>
          </Card>
          <Card className="bg-white/10 text-white ring-1 ring-white/15">
            <div className="flex items-center gap-2 text-sm font-black text-mint">
              <Flame size={17} />
              추천 키워드
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.length ? keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-white/12 px-3 py-1 text-sm font-bold">#{keyword}</span>
              )) : <span className="text-sm font-bold text-white/70">데이터를 모으는 중입니다</span>}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-black text-berry">추천 굿즈</p>
            <h2 className="text-2xl font-black">관심 태그와 가까운 상품</h2>
          </div>
          <Link href="/goods" className="text-sm font-black text-slate-500 hover:text-ink">더 보기</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
          {!products.length && <Card>등록된 굿즈가 없습니다. 관리자에서 상품을 등록해주세요.</Card>}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-black text-berry">추천 갤러리</p>
            <h2 className="text-2xl font-black">관심사와 가까운 갤러리</h2>
          </div>
          <Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">전체보기</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {galleries.map((gallery) => <GalleryCard key={gallery.id} gallery={gallery} />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-black">오늘의 인기글</h2>
            <Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">갤러리로 이동</Link>
          </div>
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="block">
                <Card className="transition hover:bg-pink-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="pink">{postTypeLabel(post.type)}</Badge>
                    <span className="text-xs font-bold text-slate-500">{post.author}</span>
                    <span className="text-xs font-bold text-slate-400">{post.createdAt}</span>
                  </div>
                  <p className="mt-2 text-lg font-black text-ink">{post.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
                  <p className="mt-3 flex gap-4 text-sm font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1"><Star size={15} /> {post.likeCount}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle size={15} /> {post.commentCount}</span>
                  </p>
                </Card>
              </Link>
            ))}
            {!posts.length && <Card>아직 게시글이 없습니다.</Card>}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-berry" />
            <h2 className="text-2xl font-black">최근 유저거래</h2>
          </div>
          <div className="space-y-3">
            {marketItems.map((item) => (
              <Link key={item.id} href={`/market/${item.id}`} className="block">
                <Card className="grid grid-cols-[4.5rem_1fr] gap-3 transition hover:bg-pink-50">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                    {item.image_url ? <Image src={item.image_url} alt="" fill className="object-cover" sizes="72px" /> : null}
                  </div>
                  <div className="min-w-0">
                    <Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge>
                    <p className="mt-2 line-clamp-1 font-black">{item.title}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{formatPrice(item.price)} · {item.galleries?.name ?? "갤러리"}</p>
                  </div>
                </Card>
              </Link>
            ))}
            {!marketItems.length && <Card>아직 유저거래 글이 없습니다.</Card>}
          </div>
        </div>
      </section>
    </div>
  );
}
