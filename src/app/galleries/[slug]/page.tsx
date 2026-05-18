import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLine, Users } from "lucide-react";
import { FollowGalleryButton } from "@/app/galleries/[slug]/follow-button";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, postTypeLabel } from "@/lib/format";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

const pageSize = 8;

type SearchParams = { page?: string };

export default async function GalleryDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminSupabaseClient();
  const authClient = await createServerSupabaseClient();
  const { data: userData } = (await authClient?.auth.getUser()) ?? { data: { user: null } };

  const { data: gallery } = await admin
    .from("galleries")
    .select("id,name,slug,description,category,thumbnail_url,follower_count,post_count")
    .eq("slug", slug)
    .single();

  if (!gallery) notFound();

  const [{ data: posts, count }, { data: follow }, productsResult] = await Promise.all([
    admin
      .from("posts")
      .select("id,title,content,post_type,like_count,comment_count,bookmark_count,created_at,profiles(nickname,email)", { count: "exact" })
      .eq("gallery_id", gallery.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(from, to),
    userData.user ? admin.from("gallery_follows").select("id").eq("gallery_id", gallery.id).eq("user_id", userData.user.id).maybeSingle() : Promise.resolve({ data: null }),
    admin
      .from("products")
      .select("id,title,normalized_title,brand,category,description,image_url,is_official_product,bookmark_count,product_offers(id,source,mall_name,price,shipping_fee,condition,is_official,is_used,special_benefit,url)")
      .ilike("category", `%${gallery.category}%`)
      .limit(3)
  ]);

  const galleryProducts: Product[] = (productsResult.data ?? []).map((product) => ({
    id: product.id,
    title: product.title,
    normalizedTitle: product.normalized_title,
    brand: product.brand ?? "",
    category: product.category,
    description: product.description ?? "",
    image: product.image_url ?? "/placeholder-goods.svg",
    isOfficialProduct: product.is_official_product ?? false,
    tags: [product.category].filter(Boolean),
    gallerySlugs: [gallery.slug],
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
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div className="space-y-6">
      <Card className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <Badge tone="mint">{gallery.category}</Badge>
          <h1 className="mt-3 text-3xl font-black">{gallery.name}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">{gallery.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>#{gallery.category}</Badge>
            <Badge>#{gallery.name.replace(" 갤러리", "")}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-4 md:items-end">
          <div className="flex gap-4 text-sm font-bold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users size={16} /> {Number(gallery.follower_count ?? 0).toLocaleString("ko-KR")} 팔로워
            </span>
            <span>{(count ?? gallery.post_count ?? 0).toLocaleString("ko-KR")} 게시글</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <FollowGalleryButton slug={slug} initialFollowed={Boolean(follow)} />
            <Link href={`/posts/new?gallery=${slug}`}>
              <Button>
                <PenLine size={16} />
                글쓰기
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["최신글", "인기글", "마켓", "굿즈"].map((tab, index) => (
          <button key={tab} className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-black ${index === 0 ? "bg-ink text-white" : "bg-white text-slate-600"}`}>
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-black">갤러리 최신글</h2>
          {(posts ?? []).map((post) => {
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            return (
              <Link key={post.id} href={`/posts/${post.id}`} className="block">
                <Card className="transition hover:bg-pink-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="pink">{postTypeLabel(post.post_type)}</Badge>
                    <span className="text-xs font-bold text-slate-500">{profile?.nickname ?? profile?.email ?? "회원"}</span>
                    <span className="text-xs font-bold text-slate-400">{formatDateTime(post.created_at)}</span>
                  </div>
                  <p className="mt-2 text-lg font-black text-ink">{post.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
                  <p className="mt-3 text-sm font-bold text-slate-500">
                    좋아요 {post.like_count} · 댓글 {post.comment_count} · 스크랩 {post.bookmark_count}
                  </p>
                </Card>
              </Link>
            );
          })}
          {!(posts ?? []).length && <Card>아직 작성된 글이 없습니다.</Card>}
          {totalPages > 1 && (
            <div className="flex justify-end gap-2">
              {page > 1 && <Link href={`/galleries/${slug}?page=${page - 1}`} className="rounded-lg bg-white px-4 py-2 text-sm font-black ring-1 ring-slate-200">이전</Link>}
              {page < totalPages && <Link href={`/galleries/${slug}?page=${page + 1}`} className="rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">다음</Link>}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-black">관련 굿즈</h2>
          {galleryProducts.length ? galleryProducts.map((product) => <ProductCard key={product.id} product={product} />) : <Card>관련 굿즈가 없습니다.</Card>}
        </div>
      </section>
    </div>
  );
}
