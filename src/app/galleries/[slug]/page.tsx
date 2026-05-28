import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, PenLine, Users } from "lucide-react";
import { FollowGalleryButton } from "@/app/galleries/[slug]/follow-button";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { summarizeGallery } from "@/lib/ai";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import { searchNaverShopping, type NormalizedExternalOffer } from "@/lib/external/naver-shopping";
import { officialSourceForGallery } from "@/lib/official-sources";
import { productFromDbRow, productSelect } from "@/lib/product-recommendations";
import { createDataSupabaseClient } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

export const dynamic = "force-dynamic";

const galleryGoodsTerms: Record<string, string[]> = {
  lol: ["롤", "리그오브레전드", "리그 오브 레전드", "League of Legends", "라이엇"],
  "eternal-return": ["이터널리턴", "이터널 리턴", "Eternal Return", "이리"],
  sanrio: ["산리오", "쿠로미", "시나모롤", "헬로키티", "마이멜로디"],
  pokemon: ["포켓몬", "Pokemon", "피카츄"],
  onepiece: ["원피스", "One Piece", "루피"],
  stellive: ["스텔라이브", "Stellive", "Fanding"],
  "webtoon-goods": ["웹툰", "웹툰프렌즈", "WEBTOON FRIENDS"],
  bts: ["BTS", "방탄소년단"],
  ghibli: ["지브리", "스튜디오 지브리", "도토리숲", "토토로", "키키", "하울"]
};

function termsForGallery(gallery: { slug: string; name: string }) {
  return [...new Set([...(galleryGoodsTerms[gallery.slug] ?? []), gallery.name])].filter(Boolean);
}

function scoreProductForTerms(product: Product, terms: string[]) {
  const compactText = `${product.title} ${product.normalizedTitle} ${product.brand} ${product.category} ${product.description} ${product.tags.join(" ")}`
    .toLowerCase()
    .replace(/\s+/g, "");
  return terms.reduce((score, term) => {
    const compactTerm = term.toLowerCase().replace(/\s+/g, "");
    return score + (compactTerm && compactText.includes(compactTerm) ? 1 : 0);
  }, 0);
}

function productFromExternal(item: NormalizedExternalOffer, gallery: { slug: string; name: string; category: string }): Product {
  return {
    id: `naver-${item.id}`,
    title: item.title,
    normalizedTitle: item.title.toLowerCase(),
    brand: item.brand ?? item.mallName,
    category: item.category ?? gallery.category,
    description: `${gallery.name} 관련 외부 판매 링크`,
    image: item.image ?? "/placeholder-goods.svg",
    isOfficialProduct: item.isOfficial,
    tags: [gallery.name, gallery.category, item.category].filter(Boolean) as string[],
    gallerySlugs: [gallery.slug],
    bookmarkCount: 0,
    offers: [
      {
        id: item.id,
        source: item.source,
        mallName: item.mallName,
        price: item.price,
        shippingFee: item.shippingFee,
        condition: item.condition,
        isOfficial: item.isOfficial,
        isUsed: item.isUsed,
        url: item.url
      }
    ]
  };
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).replace(/[\s-]+/g, "").toLowerCase();
  if ((normalizedSlug === "이터널리턴" || normalizedSlug === "eternalreturn") && slug !== "eternal-return") {
    redirect("/galleries/eternal-return");
  }

  const supabase = createDataSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: auth } = (await authClient?.auth.getUser()) ?? { data: { user: null } };
  const { data: gallery } = await supabase.from("galleries").select("id,name,slug,description,category,follower_count,post_count").eq("slug", slug).single();
  if (!gallery) notFound();
  const { data: follow } = auth.user
    ? await supabase.from("gallery_follows").select("id").eq("gallery_id", gallery.id).eq("user_id", auth.user.id).maybeSingle()
    : { data: null };
  const { data: dbOfficialSource } = await supabase.from("gallery_official_sources").select("official_site_url,official_shop_url,shop_label,notes").eq("gallery_id", gallery.id).maybeSingle();
  const fallbackOfficialSource = officialSourceForGallery(gallery.slug);
  const officialSource = dbOfficialSource
    ? {
        officialSiteUrl: dbOfficialSource.official_site_url,
        officialShopUrl: dbOfficialSource.official_shop_url ?? undefined,
        shopLabel: dbOfficialSource.shop_label ?? undefined,
        notes: dbOfficialSource.notes ?? undefined
      }
    : fallbackOfficialSource;
  const { data: posts } = await supabase.from("posts").select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,profiles(nickname,email)").eq("gallery_id", gallery.id).eq("is_deleted", false).order("created_at", { ascending: false }).limit(20);
  const gallerySummary = await summarizeGallery((posts ?? []).map((post) => `${post.title}\n${post.content}`).join("\n\n"));
  const goodsTargetCount = Math.min(10, Math.max(5, Math.ceil(Number(gallery.post_count ?? 0) / 100)));
  const goodsTerms = termsForGallery(gallery);
  const goodsFilters = goodsTerms.flatMap((term) => [`title.ilike.%${term}%`, `brand.ilike.%${term}%`, `description.ilike.%${term}%`]);
  const { data: goodsRows } = goodsFilters.length
    ? await supabase.from("products").select(productSelect).or(goodsFilters.join(",")).order("is_official_product", { ascending: false }).order("created_at", { ascending: false }).limit(80)
    : { data: [] };
  const localGoods = (goodsRows ?? [])
    .map(productFromDbRow)
    .filter((product) => product.offers.length)
    .map((product) => ({ product, score: scoreProductForTerms(product, goodsTerms) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.product.isOfficialProduct || b.product.offers.some((offer) => offer.isOfficial)) - Number(a.product.isOfficialProduct || a.product.offers.some((offer) => offer.isOfficial)) ||
        b.product.bookmarkCount - a.product.bookmarkCount
    )
    .map((item) => item.product);
  const externalGoods =
    localGoods.length < goodsTargetCount
      ? (await searchNaverShopping(`${goodsTerms[0] ?? gallery.name} 굿즈`, Math.max(20, goodsTargetCount * 3))).items.map((item) => productFromExternal(item, gallery))
      : [];
  const seenGoods = new Set<string>();
  const goods = [...localGoods, ...externalGoods]
    .filter((product) => {
      const key = product.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
      if (!key || seenGoods.has(key)) return false;
      seenGoods.add(key);
      return true;
    })
    .slice(0, goodsTargetCount);

  return (
    <div className="space-y-4">
      <Card className="relative grid gap-3 overflow-hidden rounded-[1.5rem] border-[#dfc5ee] bg-gradient-to-br from-[#fff8fb] via-white to-[#fff4fa] p-4 md:grid-cols-[1fr_auto]">
        <div><Badge tone="mint">{gallery.category}</Badge><h1 className="mt-2 text-2xl font-black text-[#6f4ab4] md:text-3xl">{gallery.name}</h1><p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-600">{gallery.description}</p></div>
        <div className="flex flex-col items-start justify-between gap-3 md:items-end"><div className="flex gap-3 text-xs font-bold text-slate-500"><span className="inline-flex items-center gap-1"><Users size={14} /> {Number(gallery.follower_count ?? 0).toLocaleString("ko-KR")} 팔로워</span><span>{Number(gallery.post_count ?? 0).toLocaleString("ko-KR")} 게시글</span></div><div className="flex flex-wrap gap-2">{officialSource ? <a href={officialSource.officialSiteUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="min-h-9 px-3 text-xs"><ExternalLink size={14} /> 공식 SNS</Button></a> : null}{officialSource?.officialShopUrl ? <a href={officialSource.officialShopUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="min-h-9 px-3 text-xs"><ExternalLink size={14} /> 공식몰</Button></a> : null}<FollowGalleryButton slug={slug} initialFollowed={Boolean(follow)} /><Link href={`/posts/new?gallery=${slug}`}><Button className="min-h-9 px-3 text-xs"><PenLine size={14} /> 글쓰기</Button></Link></div></div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
        <section className="space-y-3"><h2 className="text-xl font-black text-[#2f2352]">갤러리 최신글</h2>{(posts ?? []).map((post) => { const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles; return <Link key={post.id} href={`/posts/${post.id}`} className="block"><Card className="p-3 transition hover:bg-[#fff5fa]"><div className="flex flex-wrap items-center gap-2"><Badge tone="pink">{postTypeLabel(post.post_type)}</Badge><span className="text-xs font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"}</span><span className="text-xs font-bold text-slate-400">{formatDateTime(post.created_at)}</span></div><p className="mt-1.5 text-base font-black text-[#2f2352]">{post.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{post.content}</p><p className="mt-2 text-xs font-bold text-slate-500">좋아요 {post.like_count} · 댓글 {post.comment_count} · 스크랩 {post.bookmark_count}</p></Card></Link>; })}{!(posts ?? []).length && <Card>아직 작성된 글이 없습니다.</Card>}</section>
        <aside className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-black text-[#ff6f9b]">AI 인기 키워드</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{gallerySummary.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {gallerySummary.keywords.slice(0, 6).map((keyword) => (
                <Badge key={keyword}>#{keyword}</Badge>
              ))}
            </div>
          </Card>
          <div><p className="text-sm font-black text-berry">공식몰 우선</p><h2 className="mt-1 text-xl font-black">이 갤러리 추천 굿즈</h2></div>
          <div className="grid gap-4">{goods.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          {!goods.length && <Card>아직 연결된 굿즈가 없습니다.</Card>}
        </aside>
      </div>
    </div>
  );
}
