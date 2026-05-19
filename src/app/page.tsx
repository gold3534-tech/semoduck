import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, MessageCircle, ShoppingBag, Sparkles, Star } from "lucide-react";
import { GalleryCard } from "@/components/gallery-card";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice, postTypeLabel, tradeTypeLabel } from "@/lib/format";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import type { Gallery, Post, Product } from "@/types/domain";

export const dynamic = "force-dynamic";

type MarketPreview = { id: string; title: string; trade_type: string; price: number; image_url: string | null; galleries?: { name?: string | null } | null };

function productFrom(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    normalizedTitle: row.normalized_title,
    brand: row.brand ?? "",
    category: row.category,
    description: row.description ?? "",
    image: row.image_url ?? "/placeholder-goods.svg",
    isOfficialProduct: row.is_official_product ?? false,
    tags: [row.category, row.brand].filter(Boolean),
    gallerySlugs: [],
    bookmarkCount: row.bookmark_count ?? 0,
    offers: (row.product_offers ?? []).map((offer: any) => ({
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

async function getHomeData() {
  const supabase = createDataSupabaseClient();
  const [productsResult, galleriesResult, postsResult, marketResult] = await Promise.all([
    supabase.from("products").select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)").order("created_at", { ascending: false }).limit(3),
    supabase.from("galleries").select("id,name,slug,description,category,thumbnail_url,follower_count,post_count").order("follower_count", { ascending: false }).limit(3),
    supabase.from("posts").select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,galleries(slug),profiles(nickname)").eq("is_deleted", false).order("like_count", { ascending: false }).limit(3),
    supabase.from("market_items").select("id,title,trade_type,price,image_url,galleries(name)").in("status", ["active", "reserved"]).neq("trade_type", "transfer").order("created_at", { ascending: false }).limit(4)
  ]);

  const products = (productsResult.data ?? []).map(productFrom);
  const galleries: Gallery[] = (galleriesResult.data ?? []).map((gallery) => ({
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
  const marketItems: MarketPreview[] = (marketResult.data ?? []).map((item) => ({ ...item, galleries: Array.isArray(item.galleries) ? item.galleries[0] : item.galleries }));
  return { products, galleries, posts, marketItems };
}

export default async function HomePage() {
  const { products, galleries, posts, marketItems } = await getHomeData();
  const keywords = [...new Set([...products.map((p) => p.category), ...galleries.map((g) => g.name)])].slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-2xl bg-ink p-6 text-white shadow-soft md:grid-cols-[1.25fr_0.75fr] md:p-10">
        <div className="flex min-h-[21rem] flex-col justify-between">
          <div>
            <Badge tone="sun">팬덤 굿즈 커뮤니티</Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">추천 굿즈와 갤러리를 먼저 보여드려요</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">세모덕에서 굿즈 검색, 갤러리 이야기, 유저거래를 한 번에 확인하세요.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/goods" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-ink">굿즈 검색하기 <ArrowRight size={17} /></Link>
            <Link href="/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">글쓰기</Link>
          </div>
        </div>
        <div className="grid content-end gap-3">
          <Card className="bg-white/10 text-white ring-1 ring-white/15"><div className="flex items-center gap-2 text-sm font-black text-sun"><Sparkles size={17} /> 추천 기준</div><p className="mt-3 leading-7 text-white/80">등록된 상품과 갤러리 데이터를 기준으로 추천합니다.</p></Card>
          <Card className="bg-white/10 text-white ring-1 ring-white/15"><div className="flex items-center gap-2 text-sm font-black text-mint"><Flame size={17} /> 추천 키워드</div><div className="mt-3 flex flex-wrap gap-2">{keywords.map((keyword) => <span key={keyword} className="rounded-full bg-white/12 px-3 py-1 text-sm font-bold">#{keyword}</span>)}</div></Card>
        </div>
      </section>

      <section><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-black text-berry">추천 굿즈</p><h2 className="text-2xl font-black">최근 등록된 상품</h2></div><Link href="/goods" className="text-sm font-black text-slate-500 hover:text-ink">더 보기</Link></div><div className="grid gap-4 md:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}{!products.length && <Card>등록된 굿즈가 없습니다.</Card>}</div></section>
      <section><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-black text-berry">추천 갤러리</p><h2 className="text-2xl font-black">활동이 많은 갤러리</h2></div><Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">전체보기</Link></div><div className="grid gap-4 md:grid-cols-3">{galleries.map((gallery) => <GalleryCard key={gallery.id} gallery={gallery} />)}</div></section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div><div className="mb-4 flex items-end justify-between"><h2 className="text-2xl font-black">오늘의 인기글</h2><Link href="/galleries" className="text-sm font-black text-slate-500 hover:text-ink">갤러리로 이동</Link></div><div className="space-y-4">{posts.map((post) => <Link key={post.id} href={`/posts/${post.id}`} className="block"><Card className="transition hover:bg-pink-50"><div className="flex flex-wrap items-center gap-2"><Badge tone="pink">{postTypeLabel(post.type)}</Badge><span className="text-xs font-bold text-slate-500">{post.author}</span><span className="text-xs font-bold text-slate-400">{post.createdAt}</span></div><p className="mt-2 text-lg font-black text-ink">{post.title}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p><p className="mt-3 flex gap-4 text-sm font-bold text-slate-500"><span className="inline-flex items-center gap-1"><Star size={15} /> {post.likeCount}</span><span className="inline-flex items-center gap-1"><MessageCircle size={15} /> {post.commentCount}</span></p></Card></Link>)}{!posts.length && <Card>아직 게시글이 없습니다.</Card>}</div></div>
        <div><div className="mb-4 flex items-center gap-2"><ShoppingBag size={20} className="text-berry" /><h2 className="text-2xl font-black">최근 유저거래</h2></div><div className="space-y-3">{marketItems.map((item) => <Link key={item.id} href={`/market/${item.id}`} className="block"><Card className="grid grid-cols-[4.5rem_1fr] gap-3 transition hover:bg-pink-50"><div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">{item.image_url ? <Image src={item.image_url} alt="" fill className="object-cover" sizes="72px" /> : null}</div><div className="min-w-0"><Badge tone="mint">{tradeTypeLabel(item.trade_type)}</Badge><p className="mt-2 line-clamp-1 font-black">{item.title}</p><p className="mt-1 text-sm font-bold text-slate-500">{formatPrice(item.price)} · {item.galleries?.name ?? "갤러리"}</p></div></Card></Link>)}{!marketItems.length && <Card>아직 유저거래 글이 없습니다.</Card>}</div></div>
      </section>
    </div>
  );
}
